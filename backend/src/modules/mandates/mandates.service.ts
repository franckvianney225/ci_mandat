import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like } from 'typeorm';

import { Mandate, MandateStatus } from '../../entities/mandate.entity';
import { User } from '../../entities/user.entity';
import { SettingsService } from '../settings/settings.service';
import { EmailService, EmailType } from '../email/email.service';

interface CreateMandateDto {
  nom: string;
  prenom: string;
  fonction: string;
  email: string;
  telephone: string;
  circonscription: string;
}

interface UpdateMandateDto {
  status?: MandateStatus;
  rejectionReason?: string;
  adminApproverId?: string;
  superAdminApproverId?: string;
}

interface MandateFilters {
  search?: string;
  status?: MandateStatus;
  page?: number;
  limit?: number;
}

@Injectable()
export class MandatesService {
  private readonly logger = new Logger(MandatesService.name);

  constructor(
    @InjectRepository(Mandate)
    private mandatesRepository: Repository<Mandate>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private settingsService: SettingsService,
    private emailService: EmailService,
  ) {}

  async findAll(filters: MandateFilters = {}) {
    const {
      search,
      status,
      page = 1,
      limit = 10,
    } = filters;

    const skip = (page - 1) * limit;
    const where: FindOptionsWhere<Mandate> = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.formData = [
        { nom: Like(`%${search}%`) },
        { prenom: Like(`%${search}%`) },
        { email: Like(`%${search}%`) },
        { fonction: Like(`%${search}%`) },
        { circonscription: Like(`%${search}%`) },
      ];
    }

    const [mandates, total] = await this.mandatesRepository.findAndCount({
      where,
      relations: ['client', 'adminApprover', 'superAdminApprover'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: mandates,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Mandate> {
    const mandate = await this.mandatesRepository.findOne({
      where: { id },
      relations: ['client', 'adminApprover', 'superAdminApprover'],
    });

    if (!mandate) {
      throw new NotFoundException('Mandat non trouvé');
    }

    return mandate;
  }

  async create(createMandateDto: CreateMandateDto): Promise<Mandate> {
    // Vérifier que les champs obligatoires sont présents
    if (!createMandateDto.nom || !createMandateDto.prenom || !createMandateDto.email) {
      throw new BadRequestException('Les champs nom, prénom et email sont obligatoires');
    }

    // Vérifier si un mandat avec le même email existe déjà
    try {
      const existingMandate = await this.mandatesRepository.findOne({
        where: {
          formData: {
            email: createMandateDto.email,
          } as any,
        },
      });

      if (existingMandate) {
        throw new BadRequestException('Un mandat avec cet email existe déjà');
      }
    } catch (error) {
      // Ignorer les erreurs de recherche pour permettre la création
    }

    // Créer le mandat manuellement pour éviter les problèmes de typage
    const mandate = new Mandate();
    mandate.title = `Mandat - ${createMandateDto.nom} ${createMandateDto.prenom}`;
    mandate.description = `Demande de mandat pour ${createMandateDto.fonction || 'Non spécifié'} - ${createMandateDto.circonscription || 'Non spécifié'}`;
    mandate.formData = createMandateDto as any;
    mandate.status = MandateStatus.PENDING_VALIDATION;
    
    const savedMandate = await this.mandatesRepository.save(mandate);
    
    // Envoyer l'email de confirmation au demandeur
    await this.sendSubmissionConfirmationEmail(savedMandate);
    
    // Envoyer les notifications aux administrateurs
    await this.sendAdminNotifications(savedMandate);
    
    return savedMandate;
  }

  async update(id: string, updateMandateDto: UpdateMandateDto): Promise<Mandate> {
    const mandate = await this.findOne(id);

    if (updateMandateDto.status) {
      mandate.status = updateMandateDto.status;
      
      // Mettre à jour les dates d'approbation/rejet
      if (updateMandateDto.status === MandateStatus.ADMIN_APPROVED) {
        mandate.adminApprovedAt = new Date();
      } else if (updateMandateDto.status === MandateStatus.SUPER_ADMIN_APPROVED) {
        mandate.superAdminApprovedAt = new Date();
      } else if (updateMandateDto.status === MandateStatus.REJECTED) {
        mandate.rejectedAt = new Date();
      }
    }

    if (updateMandateDto.rejectionReason !== undefined) {
      mandate.rejectionReason = updateMandateDto.rejectionReason;
    }

    if (updateMandateDto.adminApproverId) {
      const adminApprover = await this.usersRepository.findOne({
        where: { id: updateMandateDto.adminApproverId },
      });
      if (adminApprover) {
        mandate.adminApprover = adminApprover;
        mandate.adminApproverId = adminApprover.id;
      }
    }

    if (updateMandateDto.superAdminApproverId) {
      const superAdminApprover = await this.usersRepository.findOne({
        where: { id: updateMandateDto.superAdminApproverId },
      });
      if (superAdminApprover) {
        mandate.superAdminApprover = superAdminApprover;
        mandate.superAdminApproverId = superAdminApprover.id;
      }
    }

    return await this.mandatesRepository.save(mandate);
  }

  async validateByAdmin(id: string, adminId?: string): Promise<Mandate> {
    const mandate = await this.findOne(id);

    if (!mandate.canBeApprovedByAdmin()) {
      throw new BadRequestException('Ce mandat ne peut pas être validé par un admin');
    }

    mandate.status = MandateStatus.ADMIN_APPROVED;
    mandate.adminApprovedAt = new Date();
    
    // Ne définir adminApproverId que si adminId est fourni
    if (adminId) {
      mandate.adminApproverId = adminId;
    }

    const savedMandate = await this.mandatesRepository.save(mandate);
    
    // Envoyer l'email de validation intermédiaire au demandeur
    await this.sendMandateApprovedEmail(savedMandate);
    
    return savedMandate;
  }

  async validateBySuperAdmin(id: string, superAdminId: string): Promise<Mandate> {
    const mandate = await this.findOne(id);

    if (!mandate.canBeApprovedBySuperAdmin()) {
      throw new BadRequestException('Ce mandat ne peut pas être validé par un super admin');
    }

    mandate.status = MandateStatus.SUPER_ADMIN_APPROVED;
    mandate.superAdminApprovedAt = new Date();
    mandate.superAdminApproverId = superAdminId;

    const savedMandate = await this.mandatesRepository.save(mandate);
    
    // Envoyer l'email de validation au demandeur
    await this.sendMandateApprovedEmail(savedMandate);
    
    return savedMandate;
  }

  async reject(id: string, reason: string, adminId?: string): Promise<Mandate> {
    const mandate = await this.findOne(id);

    if (!mandate.canBeRejected()) {
      throw new BadRequestException('Ce mandat ne peut pas être rejeté');
    }

    mandate.status = MandateStatus.REJECTED;
    mandate.rejectedAt = new Date();
    mandate.rejectionReason = reason;

    if (adminId) {
      mandate.adminApproverId = adminId;
    }

    const savedMandate = await this.mandatesRepository.save(mandate);
    
    // Envoyer l'email de rejet au demandeur
    await this.sendMandateRejectedEmail(savedMandate);
    
    return savedMandate;
  }

  async getStatistics() {
    const totalMandates = await this.mandatesRepository.count();
    const pendingMandates = await this.mandatesRepository.count({ 
      where: { status: MandateStatus.PENDING_VALIDATION } 
    });
    const adminApprovedMandates = await this.mandatesRepository.count({ 
      where: { status: MandateStatus.ADMIN_APPROVED } 
    });
    const superAdminApprovedMandates = await this.mandatesRepository.count({ 
      where: { status: MandateStatus.SUPER_ADMIN_APPROVED } 
    });
    const rejectedMandates = await this.mandatesRepository.count({ 
      where: { status: MandateStatus.REJECTED } 
    });

    return {
      total: totalMandates,
      pending: pendingMandates,
      adminApproved: adminApprovedMandates,
      superAdminApproved: superAdminApprovedMandates,
      rejected: rejectedMandates,
    };
  }

  async getRecentMandates(limit: number = 10): Promise<Mandate[]> {
    return await this.mandatesRepository.find({
      relations: ['client', 'adminApprover', 'superAdminApprover'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async generatePDF(mandateId: string): Promise<{ pdfBuffer: Buffer; fileName: string }> {
    const mandate = await this.findOne(mandateId);
    
    // Permettre la génération de PDF pour les mandats validés par admin ou super admin
    if (mandate.status !== MandateStatus.ADMIN_APPROVED && mandate.status !== MandateStatus.SUPER_ADMIN_APPROVED) {
      throw new BadRequestException('Seuls les mandats validés peuvent générer un PDF');
    }

    // Mettre à jour le mandat avec les informations du PDF
    mandate.pdfGenerated = true;
    mandate.pdfGeneratedAt = new Date();
    mandate.pdfUrl = `/api/v1/mandates/${mandateId}/pdf`;
    
    await this.mandatesRepository.save(mandate);
    
    // Retourner un PDF vide car la génération se fait côté frontend
    const fileName = `mandat_${mandate.referenceNumber}_${Date.now()}.pdf`;
    const pdfBuffer = Buffer.from('PDF généré côté frontend');
    
    return { pdfBuffer, fileName };
  }

  /**
   * Envoie l'email de confirmation de soumission au demandeur
   */
  private async sendSubmissionConfirmationEmail(mandate: Mandate): Promise<void> {
    try {
      const emailSent = await this.emailService.sendEmail(
        EmailType.SUBMISSION_CONFIRMATION,
        mandate.formData.email,
        { mandate }
      );
      
      if (emailSent) {
        this.logger.log(`Email de confirmation envoyé au demandeur: ${mandate.formData.email}`);
      } else {
        this.logger.warn(`Échec de l'envoi de l'email de confirmation à: ${mandate.formData.email}`);
      }
    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi de l'email de confirmation à ${mandate.formData.email}:`, error);
      // Ne pas bloquer la création du mandat en cas d'erreur d'envoi d'email
    }
  }

  /**
   * Envoie l'email de validation au demandeur avec le PDF en pièce jointe
   */
  private async sendMandateApprovedEmail(mandate: Mandate): Promise<void> {
    try {
      // Générer le PDF du mandat
      const { pdfBuffer, fileName } = await this.generatePDF(mandate.id);
      
      const emailSent = await this.emailService.sendEmail(
        EmailType.MANDATE_APPROVED,
        mandate.formData.email,
        {
          mandate,
          attachments: [
            {
              filename: fileName,
              content: pdfBuffer,
              contentType: 'application/pdf'
            }
          ]
        }
      );
      
      if (emailSent) {
        this.logger.log(`Email de validation avec PDF envoyé au demandeur: ${mandate.formData.email}`);
      } else {
        this.logger.warn(`Échec de l'envoi de l'email de validation à: ${mandate.formData.email}`);
      }
    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi de l'email de validation à ${mandate.formData.email}:`, error);
      // Ne pas bloquer la validation du mandat en cas d'erreur d'envoi d'email
    }
  }

  /**
   * Envoie l'email de rejet au demandeur
   */
  private async sendMandateRejectedEmail(mandate: Mandate): Promise<void> {
    try {
      const emailSent = await this.emailService.sendEmail(
        EmailType.MANDATE_REJECTED,
        mandate.formData.email,
        { mandate }
      );
      
      if (emailSent) {
        this.logger.log(`Email de rejet envoyé au demandeur: ${mandate.formData.email}`);
      } else {
        this.logger.warn(`Échec de l'envoi de l'email de rejet à: ${mandate.formData.email}`);
      }
    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi de l'email de rejet à ${mandate.formData.email}:`, error);
      // Ne pas bloquer le rejet du mandat en cas d'erreur d'envoi d'email
    }
  }

  private async sendAdminNotifications(mandate: Mandate): Promise<void> {
    try {
      // Récupérer tous les administrateurs
      const admins = await this.usersRepository.find({
        where: [
          { role: 'admin' as any },
          { role: 'super_admin' as any }
        ]
      });

      if (admins.length === 0) {
        this.logger.warn('Aucun administrateur trouvé pour envoyer les notifications');
        return;
      }

      // Envoyer l'email de notification à tous les administrateurs
      const emailPromises = admins.map(admin => {
        return this.emailService.sendEmail(
          EmailType.ADMIN_NOTIFICATION,
          admin.email,
          { mandate }
        );
      });

      await Promise.all(emailPromises);
      
      this.logger.log(`Notifications envoyées à ${admins.length} administrateur(s)`);
      
    } catch (error) {
      this.logger.error('Erreur lors de l\'envoi des notifications aux administrateurs:', error);
      // Ne pas bloquer la création du mandat en cas d'erreur d'envoi d'email
    }
  }

  // La méthode generateNotificationEmail a été déplacée dans EmailService
}
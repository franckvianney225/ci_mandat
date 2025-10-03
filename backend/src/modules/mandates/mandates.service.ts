import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like } from 'typeorm';

import { Mandate, MandateStatus } from '../../entities/mandate.entity';
import { User } from '../../entities/user.entity';
import { SettingsService } from '../settings/settings.service';

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

  async validateByAdmin(id: string, adminId: string): Promise<Mandate> {
    const mandate = await this.findOne(id);

    if (!mandate.canBeApprovedByAdmin()) {
      throw new BadRequestException('Ce mandat ne peut pas être validé par un admin');
    }

    mandate.status = MandateStatus.ADMIN_APPROVED;
    mandate.adminApprovedAt = new Date();
    mandate.adminApproverId = adminId;

    return await this.mandatesRepository.save(mandate);
  }

  async validateBySuperAdmin(id: string, superAdminId: string): Promise<Mandate> {
    const mandate = await this.findOne(id);

    if (!mandate.canBeApprovedBySuperAdmin()) {
      throw new BadRequestException('Ce mandat ne peut pas être validé par un super admin');
    }

    mandate.status = MandateStatus.SUPER_ADMIN_APPROVED;
    mandate.superAdminApprovedAt = new Date();
    mandate.superAdminApproverId = superAdminId;

    return await this.mandatesRepository.save(mandate);
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

    return await this.mandatesRepository.save(mandate);
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
    
    if (!mandate.isApproved()) {
      throw new BadRequestException('Seuls les mandats approuvés peuvent générer un PDF');
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

      // Récupérer la configuration email
      const emailConfig = await this.settingsService.getEmailConfig();
      
      if (!emailConfig || !emailConfig.smtpHost || !emailConfig.smtpPort || !emailConfig.smtpUsername || !emailConfig.smtpPassword) {
        this.logger.warn('Configuration SMTP non disponible pour l\'envoi de notifications');
        return;
      }

      const transporter = this.settingsService.createTransporter(emailConfig);

      // Préparer le contenu de l'email
      const subject = 'Nouvelle demande de mandat reçue';
      const htmlContent = this.generateNotificationEmail(mandate);

      // Envoyer l'email à tous les administrateurs
      const emailPromises = admins.map(admin => {
        return transporter.sendMail({
          from: emailConfig.fromEmail || emailConfig.smtpUsername,
          to: admin.email,
          subject: subject,
          html: htmlContent,
        });
      });

      await Promise.all(emailPromises);
      
      this.logger.log(`Notifications envoyées à ${admins.length} administrateur(s)`);
      
    } catch (error) {
      this.logger.error('Erreur lors de l\'envoi des notifications aux administrateurs:', error);
      // Ne pas bloquer la création du mandat en cas d'erreur d'envoi d'email
    }
  }

  private generateNotificationEmail(mandate: Mandate): string {
    const { formData, createdAt } = mandate;
    const formattedDate = new Date(createdAt).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Nouvelle demande de mandat</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #ddd;
    }
    .header {
      background: #1E40AF;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
      margin: -20px -20px 20px -20px;
    }
    .content {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .info-item {
      margin-bottom: 10px;
      padding: 10px;
      background: #f8f9fa;
      border-left: 4px solid #1E40AF;
    }
    .info-label {
      font-weight: bold;
      color: #1E40AF;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      margin-top: 20px;
    }
    .button {
      display: inline-block;
      background: #1E40AF;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 4px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Nouvelle Demande de Mandat</h1>
      <p>Une nouvelle demande a été soumise le ${formattedDate}</p>
    </div>
    
    <div class="content">
      <h2>Informations du demandeur</h2>
      
      <div class="info-item">
        <span class="info-label">Nom:</span> ${formData.nom}
      </div>
      
      <div class="info-item">
        <span class="info-label">Prénom:</span> ${formData.prenom}
      </div>
      
      <div class="info-item">
        <span class="info-label">Email:</span> ${formData.email}
      </div>
      
      <div class="info-item">
        <span class="info-label">Téléphone:</span> ${formData.telephone || 'Non spécifié'}
      </div>
      
      <div class="info-item">
        <span class="info-label">Fonction:</span> ${formData.fonction || 'Non spécifiée'}
      </div>
      
      <div class="info-item">
        <span class="info-label">Circonscription:</span> ${formData.circonscription || 'Non spécifiée'}
      </div>
      
      <p style="margin-top: 20px;">
        <a href="http://localhost:3000/ci-mandat-admin" class="button">
          Voir la demande dans l'administration
        </a>
      </p>
    </div>
    
    <div class="footer">
      <p>Ceci est une notification automatique du système de gestion des mandats.</p>
      <p>Merci de ne pas répondre à cet email.</p>
    </div>
  </div>
</body>
</html>
    `;
  }
}
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like } from 'typeorm';

import { Mandate, MandateStatus } from '../../entities/mandate.entity';
import { User } from '../../entities/user.entity';

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
  constructor(
    @InjectRepository(Mandate)
    private mandatesRepository: Repository<Mandate>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
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
    
    return await this.mandatesRepository.save(mandate);
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
}
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MandatesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const mandate_entity_1 = require("../../entities/mandate.entity");
const user_entity_1 = require("../../entities/user.entity");
let MandatesService = class MandatesService {
    constructor(mandatesRepository, usersRepository) {
        this.mandatesRepository = mandatesRepository;
        this.usersRepository = usersRepository;
    }
    async findAll(filters = {}) {
        const { search, status, page = 1, limit = 10, } = filters;
        const skip = (page - 1) * limit;
        const where = {};
        if (status) {
            where.status = status;
        }
        if (search) {
            where.formData = [
                { nom: (0, typeorm_2.Like)(`%${search}%`) },
                { prenom: (0, typeorm_2.Like)(`%${search}%`) },
                { email: (0, typeorm_2.Like)(`%${search}%`) },
                { fonction: (0, typeorm_2.Like)(`%${search}%`) },
                { circonscription: (0, typeorm_2.Like)(`%${search}%`) },
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
    async findOne(id) {
        const mandate = await this.mandatesRepository.findOne({
            where: { id },
            relations: ['client', 'adminApprover', 'superAdminApprover'],
        });
        if (!mandate) {
            throw new common_1.NotFoundException('Mandat non trouvé');
        }
        return mandate;
    }
    async create(createMandateDto) {
        if (!createMandateDto.nom || !createMandateDto.prenom || !createMandateDto.email) {
            throw new common_1.BadRequestException('Les champs nom, prénom et email sont obligatoires');
        }
        try {
            const existingMandate = await this.mandatesRepository.findOne({
                where: {
                    formData: {
                        email: createMandateDto.email,
                    },
                },
            });
            if (existingMandate) {
                throw new common_1.BadRequestException('Un mandat avec cet email existe déjà');
            }
        }
        catch (error) {
        }
        const mandate = new mandate_entity_1.Mandate();
        mandate.title = `Mandat - ${createMandateDto.nom} ${createMandateDto.prenom}`;
        mandate.description = `Demande de mandat pour ${createMandateDto.fonction || 'Non spécifié'} - ${createMandateDto.circonscription || 'Non spécifié'}`;
        mandate.formData = createMandateDto;
        mandate.status = mandate_entity_1.MandateStatus.PENDING_VALIDATION;
        return await this.mandatesRepository.save(mandate);
    }
    async update(id, updateMandateDto) {
        const mandate = await this.findOne(id);
        if (updateMandateDto.status) {
            mandate.status = updateMandateDto.status;
            if (updateMandateDto.status === mandate_entity_1.MandateStatus.ADMIN_APPROVED) {
                mandate.adminApprovedAt = new Date();
            }
            else if (updateMandateDto.status === mandate_entity_1.MandateStatus.SUPER_ADMIN_APPROVED) {
                mandate.superAdminApprovedAt = new Date();
            }
            else if (updateMandateDto.status === mandate_entity_1.MandateStatus.REJECTED) {
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
    async validateByAdmin(id, adminId) {
        const mandate = await this.findOne(id);
        if (!mandate.canBeApprovedByAdmin()) {
            throw new common_1.BadRequestException('Ce mandat ne peut pas être validé par un admin');
        }
        mandate.status = mandate_entity_1.MandateStatus.ADMIN_APPROVED;
        mandate.adminApprovedAt = new Date();
        mandate.adminApproverId = adminId;
        return await this.mandatesRepository.save(mandate);
    }
    async validateBySuperAdmin(id, superAdminId) {
        const mandate = await this.findOne(id);
        if (!mandate.canBeApprovedBySuperAdmin()) {
            throw new common_1.BadRequestException('Ce mandat ne peut pas être validé par un super admin');
        }
        mandate.status = mandate_entity_1.MandateStatus.SUPER_ADMIN_APPROVED;
        mandate.superAdminApprovedAt = new Date();
        mandate.superAdminApproverId = superAdminId;
        return await this.mandatesRepository.save(mandate);
    }
    async reject(id, reason, adminId) {
        const mandate = await this.findOne(id);
        if (!mandate.canBeRejected()) {
            throw new common_1.BadRequestException('Ce mandat ne peut pas être rejeté');
        }
        mandate.status = mandate_entity_1.MandateStatus.REJECTED;
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
            where: { status: mandate_entity_1.MandateStatus.PENDING_VALIDATION }
        });
        const adminApprovedMandates = await this.mandatesRepository.count({
            where: { status: mandate_entity_1.MandateStatus.ADMIN_APPROVED }
        });
        const superAdminApprovedMandates = await this.mandatesRepository.count({
            where: { status: mandate_entity_1.MandateStatus.SUPER_ADMIN_APPROVED }
        });
        const rejectedMandates = await this.mandatesRepository.count({
            where: { status: mandate_entity_1.MandateStatus.REJECTED }
        });
        return {
            total: totalMandates,
            pending: pendingMandates,
            adminApproved: adminApprovedMandates,
            superAdminApproved: superAdminApprovedMandates,
            rejected: rejectedMandates,
        };
    }
    async getRecentMandates(limit = 10) {
        return await this.mandatesRepository.find({
            relations: ['client', 'adminApprover', 'superAdminApprover'],
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }
};
exports.MandatesService = MandatesService;
exports.MandatesService = MandatesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(mandate_entity_1.Mandate)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], MandatesService);
//# sourceMappingURL=mandates.service.js.map
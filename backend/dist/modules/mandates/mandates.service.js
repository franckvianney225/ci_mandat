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
var MandatesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MandatesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const mandate_entity_1 = require("../../entities/mandate.entity");
const user_entity_1 = require("../../entities/user.entity");
const settings_service_1 = require("../settings/settings.service");
let MandatesService = MandatesService_1 = class MandatesService {
    constructor(mandatesRepository, usersRepository, settingsService) {
        this.mandatesRepository = mandatesRepository;
        this.usersRepository = usersRepository;
        this.settingsService = settingsService;
        this.logger = new common_1.Logger(MandatesService_1.name);
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
        const savedMandate = await this.mandatesRepository.save(mandate);
        await this.sendAdminNotifications(savedMandate);
        return savedMandate;
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
    async generatePDF(mandateId) {
        const mandate = await this.findOne(mandateId);
        if (!mandate.isApproved()) {
            throw new common_1.BadRequestException('Seuls les mandats approuvés peuvent générer un PDF');
        }
        mandate.pdfGenerated = true;
        mandate.pdfGeneratedAt = new Date();
        mandate.pdfUrl = `/api/v1/mandates/${mandateId}/pdf`;
        await this.mandatesRepository.save(mandate);
        const fileName = `mandat_${mandate.referenceNumber}_${Date.now()}.pdf`;
        const pdfBuffer = Buffer.from('PDF généré côté frontend');
        return { pdfBuffer, fileName };
    }
    async sendAdminNotifications(mandate) {
        try {
            const admins = await this.usersRepository.find({
                where: [
                    { role: 'admin' },
                    { role: 'super_admin' }
                ]
            });
            if (admins.length === 0) {
                this.logger.warn('Aucun administrateur trouvé pour envoyer les notifications');
                return;
            }
            const emailConfig = await this.settingsService.getEmailConfig();
            if (!emailConfig || !emailConfig.smtpHost || !emailConfig.smtpPort || !emailConfig.smtpUsername || !emailConfig.smtpPassword) {
                this.logger.warn('Configuration SMTP non disponible pour l\'envoi de notifications');
                return;
            }
            const transporter = this.settingsService.createTransporter(emailConfig);
            const subject = 'Nouvelle demande de mandat reçue';
            const htmlContent = this.generateNotificationEmail(mandate);
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
        }
        catch (error) {
            this.logger.error('Erreur lors de l\'envoi des notifications aux administrateurs:', error);
        }
    }
    generateNotificationEmail(mandate) {
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
};
exports.MandatesService = MandatesService;
exports.MandatesService = MandatesService = MandatesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(mandate_entity_1.Mandate)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        settings_service_1.SettingsService])
], MandatesService);
//# sourceMappingURL=mandates.service.js.map
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
var _a, _b;
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
    async generatePDF(mandateId) {
        const mandate = await this.findOne(mandateId);
        if (!mandate.isApproved()) {
            throw new common_1.BadRequestException('Seuls les mandats approuvés peuvent générer un PDF');
        }
        const htmlContent = this.generatePDFHtml(mandate);
        const pdfBuffer = await this.generatePdfFromHtml(htmlContent);
        const fileName = `mandat_${mandate.referenceNumber}_${Date.now()}.pdf`;
        mandate.pdfGenerated = true;
        mandate.pdfGeneratedAt = new Date();
        mandate.pdfUrl = `/api/v1/mandates/${mandateId}/pdf`;
        await this.mandatesRepository.save(mandate);
        return { pdfBuffer, fileName };
    }
    generatePDFHtml(mandate) {
        const { formData, referenceNumber } = mandate;
        const currentDate = new Date().toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Mandat - ${referenceNumber}</title>
  <style>
    body {
      font-family: 'Times New Roman', serif;
      margin: 0;
      padding: 40px;
      color: #000;
      line-height: 1.4;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
    }
    .cei-logo {
      text-align: left;
    }
    .cei-logo .title {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .cei-logo .circle {
      width: 60px;
      height: 60px;
      background-color: #FFD700;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 10px 0;
    }
    .cei-logo .circle span {
      font-size: 12px;
      font-weight: bold;
    }
    .republic {
      text-align: right;
      font-size: 14px;
    }
    .main-title {
      text-align: center;
      margin-bottom: 30px;
    }
    .main-title .border-box {
      border: 4px solid #000;
      padding: 20px;
      margin-bottom: 20px;
    }
    .main-title h1 {
      font-size: 24px;
      font-weight: bold;
      margin: 0 0 10px 0;
    }
    .main-title .date {
      font-size: 20px;
      font-weight: bold;
      color: #1E40AF;
    }
    .subtitle {
      text-align: center;
      margin-bottom: 30px;
    }
    .subtitle h2 {
      font-size: 18px;
      font-weight: bold;
      text-decoration: underline;
      margin: 5px 0;
    }
    .content {
      font-size: 14px;
      margin-bottom: 40px;
    }
    .content p {
      margin-bottom: 15px;
    }
    .content strong {
      font-weight: bold;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 60px;
    }
    .date-section {
      font-size: 14px;
    }
    .signature {
      text-align: center;
    }
    .signature .label {
      font-size: 14px;
      margin-bottom: 30px;
    }
    .signature .name {
      font-size: 18px;
      font-weight: bold;
      text-decoration: underline;
    }
    .reference {
      text-align: center;
      font-size: 12px;
      color: #666;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <!-- En-tête avec logos -->
  <div class="header">
    <div class="cei-logo">
      <div class="title">COMMISSION ELECTORALE</div>
      <div class="title">INDÉPENDANTE</div>
      <div class="circle">
        <span>CEI</span>
      </div>
      <div style="font-size: 12px; font-weight: bold;">CURESS</div>
      <div style="font-size: 11px; color: #666;">L'Espérance au Service du Peuple</div>
    </div>

    <div class="republic">
      <div>RÉPUBLIQUE DE CÔTE D'IVOIRE</div>
      <div>Union-Discipline-Travail</div>
    </div>
  </div>

  <!-- Titre principal -->
  <div class="main-title">
    <div class="border-box">
      <h1>ÉLECTION PRESIDENTIELLE</h1>
      <div class="date">SCRUTIN DU 25 OCTOBRE 2025</div>
    </div>
  </div>

  <!-- Sous-titre -->
  <div class="subtitle">
    <h2>MANDAT DU REPRÉSENTANT PRINCIPAL</h2>
    <h2>DANS LE BUREAU DE VOTE</h2>
  </div>

  <!-- Corps du document -->
  <div class="content">
    <p>
      Conformément aux dispositions des articles 35 nouveau et 38 du code électoral :
    </p>

    <p>
      <strong>ALLASSANE OUATTARA</strong> candidat à l'élection présidentielle du 25 octobre 2025,
    </p>

    <p>
      donne mandat à ${formData.fonction} <strong>${formData.prenom} ${formData.nom}</strong>
    </p>

    <p>
      pour le représenter dans le Bureau de vote n°................................................
    </p>

    <p>
      du Lieu de Vote................................................................................................
    </p>

    <p>
      de la circonscription électorale d'<strong>${formData.circonscription}</strong>.
    </p>

    <p>
      Le présent mandat lui est délivré en qualité de Représentant(e) Principal(e) pour servir les intérêts du Candidat <strong>${formData.prenom} ${formData.nom}</strong> et en valoir ce que de droit.
    </p>
  </div>

  <!-- Date et signature -->
  <div class="footer">
    <div class="date-section">
      Fait .................................................. le ${currentDate}
    </div>

    <div class="signature">
      <div class="label">Le Candidat</div>
      <div class="name">
        Dr ${formData.prenom} ${formData.nom}
      </div>
    </div>
  </div>

  <!-- Référence -->
  <div class="reference">
    Référence: ${referenceNumber}
  </div>
</body>
</html>
    `;
    }
    async generatePdfFromHtml(html) {
        try {
            const puppeteer = require('puppeteer');
            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20mm',
                    right: '20mm',
                    bottom: '20mm',
                    left: '20mm'
                }
            });
            await browser.close();
            return pdfBuffer;
        }
        catch (error) {
            console.error('Erreur lors de la génération du PDF:', error);
            throw new common_1.BadRequestException('Erreur lors de la génération du PDF');
        }
    }
};
exports.MandatesService = MandatesService;
exports.MandatesService = MandatesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(mandate_entity_1.Mandate)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object])
], MandatesService);
//# sourceMappingURL=mandates.service.js.map
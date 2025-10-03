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

  async generatePDF(mandateId: string): Promise<{ pdfBuffer: Buffer; fileName: string }> {
    const mandate = await this.findOne(mandateId);
    
    if (!mandate.isApproved()) {
      throw new BadRequestException('Seuls les mandats approuvés peuvent générer un PDF');
    }

    // Générer le contenu HTML du PDF
    const htmlContent = this.generatePDFHtml(mandate);
    
    // Utiliser Puppeteer pour générer le PDF
    const pdfBuffer = await this.generatePdfFromHtml(htmlContent);
    
    const fileName = `mandat_${mandate.referenceNumber}_${Date.now()}.pdf`;
    
    // Mettre à jour le mandat avec les informations du PDF
    mandate.pdfGenerated = true;
    mandate.pdfGeneratedAt = new Date();
    mandate.pdfUrl = `/api/v1/mandates/${mandateId}/pdf`;
    
    await this.mandatesRepository.save(mandate);
    
    return { pdfBuffer, fileName };
  }

  private generatePDFHtml(mandate: Mandate): string {
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

  private async generatePdfFromHtml(html: string): Promise<Buffer> {
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
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      throw new BadRequestException('Erreur lors de la génération du PDF');
    }
  }
}
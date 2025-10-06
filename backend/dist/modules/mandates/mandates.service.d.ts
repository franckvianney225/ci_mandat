import { Repository } from 'typeorm';
import { Mandate, MandateStatus } from '../../entities/mandate.entity';
import { User } from '../../entities/user.entity';
import { SettingsService } from '../settings/settings.service';
import { EmailService } from '../email/email.service';
import { PdfService } from '../pdf/pdf.service';
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
export declare class MandatesService {
    private mandatesRepository;
    private usersRepository;
    private settingsService;
    private emailService;
    private pdfService;
    private readonly logger;
    constructor(mandatesRepository: Repository<Mandate>, usersRepository: Repository<User>, settingsService: SettingsService, emailService: EmailService, pdfService: PdfService);
    findAll(filters?: MandateFilters): Promise<{
        data: Mandate[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<Mandate>;
    create(createMandateDto: CreateMandateDto): Promise<Mandate>;
    update(id: string, updateMandateDto: UpdateMandateDto): Promise<Mandate>;
    validateByAdmin(id: string, adminId?: string): Promise<Mandate>;
    validateBySuperAdmin(id: string, superAdminId: string): Promise<Mandate>;
    reject(id: string, reason: string, adminId?: string): Promise<Mandate>;
    getStatistics(): Promise<{
        total: number;
        pending: number;
        adminApproved: number;
        superAdminApproved: number;
        rejected: number;
    }>;
    getRecentMandates(limit?: number): Promise<Mandate[]>;
    generatePDF(mandateId: string): Promise<{
        pdfBuffer: Buffer;
        fileName: string;
    }>;
    remove(id: string): Promise<void>;
    private sendSubmissionConfirmationEmail;
    private sendMandateApprovedEmail;
    private sendMandateRejectedEmail;
    private sendAdminNotifications;
}
export {};

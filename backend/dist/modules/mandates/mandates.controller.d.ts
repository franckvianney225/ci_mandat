import { MandatesService } from './mandates.service';
import { Response } from 'express';
import { CreateMandateDto } from './dto/create-mandate.dto';
import { UpdateMandateDto } from './dto/update-mandate.dto';
import { MandateFiltersDto } from './dto/mandate-filters.dto';
import { RejectMandateDto } from './dto/reject-mandate.dto';
import { RecaptchaService } from '../security/recaptcha.service';
export declare class MandatesController {
    private readonly mandatesService;
    private readonly recaptchaService;
    constructor(mandatesService: MandatesService, recaptchaService: RecaptchaService);
    create(createMandateDto: CreateMandateDto, recaptchaToken?: string): Promise<{
        success: boolean;
        data: import("../../entities/mandate.entity").Mandate;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
        message?: undefined;
    }>;
    findAll(filters: MandateFiltersDto): Promise<{
        data: import("../../entities/mandate.entity").Mandate[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getStatistics(): Promise<{
        total: number;
        pending: number;
        adminApproved: number;
        superAdminApproved: number;
        rejected: number;
    }>;
    getRecentMandates(): Promise<import("../../entities/mandate.entity").Mandate[]>;
    findOne(id: string): Promise<import("../../entities/mandate.entity").Mandate>;
    update(id: string, updateMandateDto: UpdateMandateDto): Promise<import("../../entities/mandate.entity").Mandate>;
    validateByAdmin(id: string, req: any): Promise<import("../../entities/mandate.entity").Mandate>;
    validateBySuperAdmin(id: string, req: any): Promise<import("../../entities/mandate.entity").Mandate>;
    reject(id: string, rejectMandateDto: RejectMandateDto, req: any): Promise<import("../../entities/mandate.entity").Mandate>;
    generatePDF(id: string, res: Response): Promise<void>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
    }>;
}

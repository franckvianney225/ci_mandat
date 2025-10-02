import { MandatesService } from './mandates.service';
import { MandateStatus } from '../../entities/mandate.entity';
declare class UpdateMandateDto {
    status?: MandateStatus;
    rejectionReason?: string;
}
declare class MandateFiltersDto {
    search?: string;
    status?: MandateStatus;
    page?: number;
    limit?: number;
}
declare class RejectMandateDto {
    reason: string;
}
export declare class MandatesController {
    private readonly mandatesService;
    constructor(mandatesService: MandatesService);
    create(body: any): Promise<{
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
}
export {};

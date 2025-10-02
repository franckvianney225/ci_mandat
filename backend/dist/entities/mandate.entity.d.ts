import { User } from './user.entity';
export declare enum MandateStatus {
    DRAFT = "draft",
    PENDING_VALIDATION = "pending_validation",
    ADMIN_APPROVED = "admin_approved",
    SUPER_ADMIN_APPROVED = "super_admin_approved",
    REJECTED = "rejected",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare class Mandate {
    id: string;
    client: User;
    clientId: string;
    adminApprover: User;
    adminApproverId: string;
    superAdminApprover: User;
    superAdminApproverId: string;
    title: string;
    description: string;
    referenceNumber: string;
    formData: {
        nom: string;
        prenom: string;
        email: string;
        telephone: string;
        departement: string;
        [key: string]: any;
    };
    status: MandateStatus;
    adminApprovedAt: Date;
    superAdminApprovedAt: Date;
    rejectedAt: Date;
    rejectionReason: string;
    pdfGenerated: boolean;
    pdfUrl: string;
    pdfGeneratedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date;
    generateReferenceNumber(): void;
    canBeApprovedByAdmin(): boolean;
    canBeApprovedBySuperAdmin(): boolean;
    canBeRejected(): boolean;
    isApproved(): boolean;
    isRejected(): boolean;
    isPending(): boolean;
    getApprovalLevel(): number;
    getStatusLabel(): string;
    toJSON(): this & {
        statusLabel: string;
        approvalLevel: number;
    };
}

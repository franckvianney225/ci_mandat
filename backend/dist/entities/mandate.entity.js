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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mandate = exports.MandateStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
var MandateStatus;
(function (MandateStatus) {
    MandateStatus["DRAFT"] = "draft";
    MandateStatus["PENDING_VALIDATION"] = "pending_validation";
    MandateStatus["ADMIN_APPROVED"] = "admin_approved";
    MandateStatus["SUPER_ADMIN_APPROVED"] = "super_admin_approved";
    MandateStatus["REJECTED"] = "rejected";
    MandateStatus["COMPLETED"] = "completed";
    MandateStatus["CANCELLED"] = "cancelled";
})(MandateStatus || (exports.MandateStatus = MandateStatus = {}));
let Mandate = class Mandate {
    generateReferenceNumber() {
        if (!this.referenceNumber) {
            const timestamp = Date.now().toString().slice(-8);
            const random = Math.random().toString(36).substring(2, 6).toUpperCase();
            this.referenceNumber = `MND-${timestamp}-${random}`;
        }
    }
    canBeApprovedByAdmin() {
        return this.status === MandateStatus.PENDING_VALIDATION;
    }
    canBeApprovedBySuperAdmin() {
        return this.status === MandateStatus.ADMIN_APPROVED;
    }
    canBeRejected() {
        return [
            MandateStatus.PENDING_VALIDATION,
            MandateStatus.ADMIN_APPROVED,
        ].includes(this.status);
    }
    isApproved() {
        return this.status === MandateStatus.SUPER_ADMIN_APPROVED;
    }
    isRejected() {
        return this.status === MandateStatus.REJECTED;
    }
    isPending() {
        return [
            MandateStatus.PENDING_VALIDATION,
            MandateStatus.ADMIN_APPROVED,
        ].includes(this.status);
    }
    getApprovalLevel() {
        switch (this.status) {
            case MandateStatus.PENDING_VALIDATION:
                return 1;
            case MandateStatus.ADMIN_APPROVED:
                return 2;
            case MandateStatus.SUPER_ADMIN_APPROVED:
                return 3;
            default:
                return 0;
        }
    }
    getStatusLabel() {
        const statusLabels = {
            [MandateStatus.DRAFT]: 'Brouillon',
            [MandateStatus.PENDING_VALIDATION]: 'En attente de validation',
            [MandateStatus.ADMIN_APPROVED]: 'Validé par admin',
            [MandateStatus.SUPER_ADMIN_APPROVED]: 'Validé définitivement',
            [MandateStatus.REJECTED]: 'Rejeté',
            [MandateStatus.COMPLETED]: 'Terminé',
            [MandateStatus.CANCELLED]: 'Annulé',
        };
        return statusLabels[this.status] || this.status;
    }
    toJSON() {
        return {
            ...this,
            statusLabel: this.getStatusLabel(),
            approvalLevel: this.getApprovalLevel(),
        };
    }
};
exports.Mandate = Mandate;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Mandate.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.mandates, { nullable: true }),
    (0, typeorm_1.Index)(),
    (0, typeorm_1.JoinColumn)({ name: 'client_id' }),
    __metadata("design:type", user_entity_1.User)
], Mandate.prototype, "client", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.approvedMandatesAsAdmin, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'admin_approver_id' }),
    __metadata("design:type", user_entity_1.User)
], Mandate.prototype, "adminApprover", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.approvedMandatesAsSuperAdmin, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'super_admin_approver_id' }),
    __metadata("design:type", user_entity_1.User)
], Mandate.prototype, "superAdminApprover", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Mandate.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Mandate.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, unique: true, name: 'reference_number' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Mandate.prototype, "referenceNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'form_data' }),
    __metadata("design:type", Object)
], Mandate.prototype, "formData", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: MandateStatus,
        default: MandateStatus.DRAFT,
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Mandate.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true, name: 'admin_approved_at' }),
    __metadata("design:type", Date)
], Mandate.prototype, "adminApprovedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true, name: 'super_admin_approved_at' }),
    __metadata("design:type", Date)
], Mandate.prototype, "superAdminApprovedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true, name: 'rejected_at' }),
    __metadata("design:type", Date)
], Mandate.prototype, "rejectedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'rejection_reason' }),
    __metadata("design:type", String)
], Mandate.prototype, "rejectionReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false, name: 'pdf_generated' }),
    __metadata("design:type", Boolean)
], Mandate.prototype, "pdfGenerated", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true, name: 'pdf_url' }),
    __metadata("design:type", String)
], Mandate.prototype, "pdfUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true, name: 'pdf_generated_at' }),
    __metadata("design:type", Date)
], Mandate.prototype, "pdfGeneratedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz', name: 'created_at' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Date)
], Mandate.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz', name: 'updated_at' }),
    __metadata("design:type", Date)
], Mandate.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true, name: 'expires_at' }),
    __metadata("design:type", Date)
], Mandate.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Mandate.prototype, "generateReferenceNumber", null);
exports.Mandate = Mandate = __decorate([
    (0, typeorm_1.Entity)('mandates')
], Mandate);
//# sourceMappingURL=mandate.entity.js.map
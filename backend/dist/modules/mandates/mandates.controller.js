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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MandatesController = void 0;
const common_1 = require("@nestjs/common");
const mandates_service_1 = require("./mandates.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const user_entity_1 = require("../../entities/user.entity");
const express_1 = require("express");
class CreateMandateDto {
}
class UpdateMandateDto {
}
class MandateFiltersDto {
}
class RejectMandateDto {
}
let MandatesController = class MandatesController {
    constructor(mandatesService) {
        this.mandatesService = mandatesService;
    }
    async create(body) {
        try {
            const createMandateDto = {
                nom: body.nom || '',
                prenom: body.prenom || '',
                fonction: body.fonction || '',
                email: body.email || '',
                telephone: body.telephone || '',
                circonscription: body.circonscription || ''
            };
            const mandate = await this.mandatesService.create(createMandateDto);
            return {
                success: true,
                data: mandate,
                message: 'Mandat créé avec succès'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Erreur lors de la création du mandat'
            };
        }
    }
    async findAll(filters) {
        return this.mandatesService.findAll(filters);
    }
    async getStatistics() {
        return this.mandatesService.getStatistics();
    }
    async getRecentMandates() {
        return this.mandatesService.getRecentMandates();
    }
    async findOne(id) {
        return this.mandatesService.findOne(id);
    }
    async update(id, updateMandateDto) {
        return this.mandatesService.update(id, updateMandateDto);
    }
    async validateByAdmin(id, req) {
        const adminId = req.user.id;
        return this.mandatesService.validateByAdmin(id, adminId);
    }
    async validateBySuperAdmin(id, req) {
        const superAdminId = req.user.id;
        return this.mandatesService.validateBySuperAdmin(id, superAdminId);
    }
    async reject(id, rejectMandateDto, req) {
        const adminId = req.user.id;
        return this.mandatesService.reject(id, rejectMandateDto.reason, adminId);
    }
    async generatePDF(id, res) {
        try {
            const { pdfBuffer, fileName } = await this.mandatesService.generatePDF(id);
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Content-Length': pdfBuffer.length,
            });
            res.send(pdfBuffer);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Erreur lors de la génération du PDF', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.MandatesController = MandatesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MandatesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [MandateFiltersDto]),
    __metadata("design:returntype", Promise)
], MandatesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('statistics'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.SUPER_ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MandatesController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Get)('recent'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.SUPER_ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MandatesController.prototype, "getRecentMandates", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MandatesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateMandateDto]),
    __metadata("design:returntype", Promise)
], MandatesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/validate-admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MandatesController.prototype, "validateByAdmin", null);
__decorate([
    (0, common_1.Patch)(':id/validate-super-admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MandatesController.prototype, "validateBySuperAdmin", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, RejectMandateDto, Object]),
    __metadata("design:returntype", Promise)
], MandatesController.prototype, "reject", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_a = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], MandatesController.prototype, "generatePDF", null);
exports.MandatesController = MandatesController = __decorate([
    (0, common_1.Controller)('mandates'),
    __metadata("design:paramtypes", [mandates_service_1.MandatesService])
], MandatesController);
//# sourceMappingURL=mandates.controller.js.map
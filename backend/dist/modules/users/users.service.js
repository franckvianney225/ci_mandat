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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const user_entity_1 = require("../../entities/user.entity");
let UsersService = class UsersService {
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
        this.createDefaultAdmin();
    }
    async createDefaultAdmin() {
        try {
            const defaultAdminEmail = 'admin@mandat.com';
            const defaultAdminPassword = 'admincimandat20_25';
            const existingAdmin = await this.findByEmail(defaultAdminEmail);
            if (existingAdmin) {
                console.log('✅ Compte administrateur par défaut existe déjà');
                return;
            }
            const saltRounds = 12;
            const passwordHash = await bcrypt.hash(defaultAdminPassword, saltRounds);
            const adminUser = this.usersRepository.create({
                email: defaultAdminEmail,
                passwordHash,
                role: user_entity_1.UserRole.SUPER_ADMIN,
                status: user_entity_1.UserStatus.ACTIVE,
                personalData: {
                    firstName: 'Administrateur',
                    lastName: 'Système',
                    phone: '+225 00 00 00 00',
                    department: 'Administration'
                }
            });
            await this.usersRepository.save(adminUser);
            console.log('✅ Compte administrateur par défaut créé avec succès');
            console.log(`📧 Email: ${defaultAdminEmail}`);
            console.log(`🔑 Mot de passe: ${defaultAdminPassword}`);
        }
        catch (error) {
            console.error('❌ Erreur lors de la création du compte administrateur par défaut:', error);
        }
    }
    async findAll(filters = {}) {
        const { search, role, status, page = 1, limit = 10, } = filters;
        const skip = (page - 1) * limit;
        const where = {};
        if (role) {
            where.role = role;
        }
        if (status) {
            where.status = status;
        }
        if (search) {
            where.personalData = [
                { firstName: (0, typeorm_2.Like)(`%${search}%`) },
                { lastName: (0, typeorm_2.Like)(`%${search}%`) },
            ];
            where.email = (0, typeorm_2.Like)(`%${search}%`);
        }
        const [users, total] = await this.usersRepository.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            skip,
            take: limit,
        });
        return {
            data: users,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id) {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        }
        return user;
    }
    async findByEmail(email) {
        return this.usersRepository.findOne({ where: { email } });
    }
    async create(createUserDto) {
        const existingUser = await this.findByEmail(createUserDto.email);
        if (existingUser) {
            throw new common_1.BadRequestException('Un utilisateur avec cet email existe déjà');
        }
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(createUserDto.password, saltRounds);
        const user = this.usersRepository.create({
            ...createUserDto,
            passwordHash,
            status: user_entity_1.UserStatus.PENDING_VERIFICATION,
        });
        return await this.usersRepository.save(user);
    }
    async update(id, updateUserDto) {
        const user = await this.findOne(id);
        if (updateUserDto.email && updateUserDto.email !== user.email) {
            const existingUser = await this.findByEmail(updateUserDto.email);
            if (existingUser) {
                throw new common_1.BadRequestException('Un utilisateur avec cet email existe déjà');
            }
        }
        Object.assign(user, updateUserDto);
        return await this.usersRepository.save(user);
    }
    async remove(id) {
        const user = await this.findOne(id);
        await this.usersRepository.remove(user);
    }
    async activateUser(id) {
        const user = await this.findOne(id);
        user.status = user_entity_1.UserStatus.ACTIVE;
        return await this.usersRepository.save(user);
    }
    async suspendUser(id) {
        const user = await this.findOne(id);
        user.status = user_entity_1.UserStatus.SUSPENDED;
        return await this.usersRepository.save(user);
    }
    async getStatistics() {
        const totalUsers = await this.usersRepository.count();
        const activeUsers = await this.usersRepository.count({ where: { status: user_entity_1.UserStatus.ACTIVE } });
        const pendingUsers = await this.usersRepository.count({ where: { status: user_entity_1.UserStatus.PENDING_VERIFICATION } });
        const suspendedUsers = await this.usersRepository.count({ where: { status: user_entity_1.UserStatus.SUSPENDED } });
        const adminUsers = await this.usersRepository.count({ where: { role: user_entity_1.UserRole.ADMIN } });
        const superAdminUsers = await this.usersRepository.count({ where: { role: user_entity_1.UserRole.SUPER_ADMIN } });
        return {
            total: totalUsers,
            byStatus: {
                active: activeUsers,
                pending: pendingUsers,
                suspended: suspendedUsers,
            },
            byRole: {
                admin: adminUsers,
                superAdmin: superAdminUsers,
            },
        };
    }
    async resetPassword(id, newPassword) {
        const user = await this.findOne(id);
        const saltRounds = 12;
        user.passwordHash = await bcrypt.hash(newPassword, saltRounds);
        await this.usersRepository.save(user);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object])
], UsersService);
//# sourceMappingURL=users.service.js.map
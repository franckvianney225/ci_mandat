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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const user_entity_1 = require("../../entities/user.entity");
let AuthService = class AuthService {
    constructor(usersRepository, jwtService) {
        this.usersRepository = usersRepository;
        this.jwtService = jwtService;
    }
    async validateUser(email, password) {
        const user = await this.usersRepository.findOne({ where: { email } });
        console.log('🔍 Recherche utilisateur avec email:', email);
        console.log('👤 Utilisateur trouvé:', user ? {
            id: user.id,
            email: user.email,
            hasPasswordHash: !!user.passwordHash,
            passwordHashLength: user.passwordHash?.length
        } : 'Aucun utilisateur trouvé');
        if (!user) {
            throw new common_1.UnauthorizedException('Email ou mot de passe incorrect');
        }
        if (user.status === user_entity_1.UserStatus.SUSPENDED) {
            throw new common_1.UnauthorizedException('Compte suspendu');
        }
        if (!user.passwordHash) {
            console.error('❌ Hash du mot de passe vide pour l\'utilisateur:', user.email);
            throw new common_1.UnauthorizedException('Compte mal configuré - contactez l\'administrateur');
        }
        console.log('🔑 Tentative de comparaison du mot de passe...');
        console.log('📧 Email reçu:', email);
        console.log('🔐 Mot de passe reçu:', password ? '***' : 'VIDE');
        console.log('🔑 Hash stocké:', user.passwordHash ? '***' : 'VIDE');
        if (!password) {
            console.error('❌ Mot de passe vide reçu');
            throw new common_1.UnauthorizedException('Mot de passe requis');
        }
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            user.loginAttempts += 1;
            if (user.loginAttempts >= 5) {
                user.status = user_entity_1.UserStatus.SUSPENDED;
            }
            await this.usersRepository.save(user);
            throw new common_1.UnauthorizedException('Email ou mot de passe incorrect');
        }
        if (user.loginAttempts > 0) {
            user.loginAttempts = 0;
        }
        user.lastLogin = new Date().toISOString();
        await this.usersRepository.save(user);
        return user;
    }
    async login(email, password) {
        const user = await this.validateUser(email, password);
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        const access_token = this.jwtService.sign(payload);
        return {
            access_token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                status: user.status,
                personalData: user.personalData,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin,
                loginAttempts: user.loginAttempts,
            },
        };
    }
    async register(email, password, personalData, role = user_entity_1.UserRole.ADMIN) {
        const existingUser = await this.usersRepository.findOne({ where: { email } });
        if (existingUser) {
            throw new common_1.BadRequestException('Un utilisateur avec cet email existe déjà');
        }
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        const user = this.usersRepository.create({
            email,
            passwordHash,
            role,
            status: user_entity_1.UserStatus.PENDING_VERIFICATION,
            personalData,
        });
        return await this.usersRepository.save(user);
    }
    async validateToken(userId) {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.UnauthorizedException('Utilisateur non trouvé');
        }
        if (user.status !== user_entity_1.UserStatus.ACTIVE) {
            throw new common_1.UnauthorizedException('Compte non actif');
        }
        return user;
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.UnauthorizedException('Utilisateur non trouvé');
        }
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isCurrentPasswordValid) {
            throw new common_1.UnauthorizedException('Mot de passe actuel incorrect');
        }
        const saltRounds = 12;
        user.passwordHash = await bcrypt.hash(newPassword, saltRounds);
        await this.usersRepository.save(user);
    }
    async updateProfile(userId, profileData) {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.UnauthorizedException('Utilisateur non trouvé');
        }
        user.personalData = {
            ...user.personalData,
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            phone: profileData.phone,
        };
        return await this.usersRepository.save(user);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
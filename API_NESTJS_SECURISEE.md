
# API NestJS Sécurisée - Documentation Complète

## Structure du Projet Backend

```
backend/
├── src/
│   ├── main.ts                          # Point d'entrée
│   ├── app.module.ts                    # Module principal
│   ├── config/                          # Configuration
│   │   ├── configuration.ts
│   │   ├── database.config.ts
│   │   └── security.config.ts
│   ├── modules/                         # Modules fonctionnels
│   │   ├── auth/                        # Authentification
│   │   ├── users/                       # Gestion utilisateurs
│   │   ├── mandates/                    # Gestion mandats
│   │   ├── security/                    # Sécurité
│   │   └── email/                       # Service email
│   ├── common/                          # Utilitaires communs
│   │   ├── decorators/                  # Décorateurs personnalisés
│   │   ├── guards/                      # Guards de sécurité
│   │   ├── interceptors/                # Intercepteurs
│   │   ├── pipes/                       # Pipes de validation
│   │   └── filters/                     # Filtres d'exception
│   └── entities/                        # Entités TypeORM
└── test/                                # Tests
```

## Module d'Authentification

### Configuration JWT Avancée

```typescript
// src/modules/auth/jwt.config.ts
import { JwtModuleOptions } from '@nestjs/jwt';

export const jwtConfig: JwtModuleOptions = {
  secret: process.env.JWT_ACCESS_SECRET,
  signOptions: {
    expiresIn: '15m', // Court pour la sécurité
    issuer: 'mandat-app',
    audience: 'mandat-app-users',
  },
};

export const refreshJwtConfig = {
  secret: process.env.JWT_REFRESH_SECRET,
  signOptions: {
    expiresIn: '7d', // Long pour le confort utilisateur
  },
};
```

### Service d'Authentification

```typescript
// src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AuditService } from '../security/audit.service';
import { TwoFactorService } from './two-factor.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private auditService: AuditService,
    private twoFactorService: TwoFactorService,
  ) {}

  async validateUser(email: string, password: string, ip: string, userAgent: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      await this.auditService.logLoginFailed(null, email, ip, userAgent, 'User not found');
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Vérifier si le compte est verrouillé
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await this.auditService.logLoginFailed(user.id, email, ip, userAgent, 'Account locked');
      throw new ForbiddenException('Compte temporairement verrouillé');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      await this.handleFailedLogin(user, ip, userAgent);
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Réinitialiser les tentatives de connexion
    await this.usersService.resetLoginAttempts(user.id);

    await this.auditService.logLoginSuccess(user.id, ip, userAgent);
    return user;
  }

  async login(user: any, ip: string, userAgent: string, twoFactorCode?: string) {
    // Vérification 2FA si activée
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        throw new UnauthorizedException('Code 2FA requis');
      }
      
      const isValid2FA = await this.twoFactorService.verifyToken(user, twoFactorCode);
      if (!isValid2FA) {
        await this.auditService.logLoginFailed(user.id, user.email, ip, userAgent, 'Invalid 2FA code');
        throw new UnauthorizedException('Code 2FA invalide');
      }
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId: await this.generateSessionId(),
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(user.id, ip, userAgent);

    await this.usersService.updateLastLogin(user.id);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 900, // 15 minutes
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    };
  }

  private async handleFailedLogin(user: any, ip: string, userAgent: string) {
    const attempts = await this.usersService.incrementLoginAttempts(user.id);
    
    if (attempts >= 5) {
      await this.usersService.lockAccount(user.id, 30); // Verrouiller 30 minutes
      await this.auditService.logSecurityEvent({
        userId: user.id,
        action: 'account_locked',
        severity: 'high',
        ipAddress: ip,
        userAgent,
        details: 'Account locked due to multiple failed login attempts',
      });
    }
  }

  private async generateRefreshToken(userId: string, ip: string, userAgent: string): Promise<string> {
    const refreshToken = this.jwtService.sign(
      { sub: userId, type: 'refresh' },
      refreshJwtConfig,
    );
    
    // Stocker le hash du refresh token
    await this.usersService.storeRefreshToken(userId, refreshToken, ip, userAgent);
    
    return refreshToken;
  }

  private async generateSessionId(): Promise<string> {
    return require('crypto').randomBytes(32).toString('hex');
  }
}
```

### Guards de Sécurité

```typescript
// src/common/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Token JWT invalide ou expiré');
    }

    // Vérifier les sessions actives
    if (!this.isSessionValid(user)) {
      throw new UnauthorizedException('Session invalide');
    }

    return user;
  }

  private isSessionValid(user: any): boolean {
    // Implémentation de la validation de session
    // Vérifier en base de données si la session est toujours active
    return true; // Simplifié pour l'exemple
  }
}

// src/common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    const hasRole = requiredRoles.some((role) => user.role === role);
    
    if (!hasRole) {
      throw new ForbiddenException(
        `Accès refusé. Rôles requis: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
```

## Module de Gestion des Mandats

### Contrôleur des Mandats

```typescript
// src/modules/mandates/mandates.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MandatesService } from './mandates.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { CreateMandateDto } from './dto/create-mandate.dto';
import { ApproveMandateDto } from './dto/approve-mandate.dto';

@Controller('mandates')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class MandatesController {
  constructor(private readonly mandatesService: MandatesService) {}

  @Post()
  @RateLimit({ points: 5, duration: 3600 }) // 5 requêtes par heure
  @Roles(UserRole.CLIENT)
  async create(
    @Body() createMandateDto: CreateMandateDto,
    @CurrentUser() user: any,
  ) {
    return this.mandatesService.create(createMandateDto, user.id);
  }

  @Get()
  async findAll(
    @Query() query: any,
    @CurrentUser() user: any,
  ) {
    // Les clients voient seulement leurs mandats
    // Les admins voient tous les mandats
    return this.mandatesService.findAll(query, user);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.mandatesService.findOne(id, user);
  }

  @Patch(':id/approve')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async approve(
    @Param('id') id: string,
    @Body() approveMandateDto: ApproveMandateDto,
    @CurrentUser() user: any,
  ) {
    return this.mandatesService.approve(id, user, approveMandateDto);
  }

  @Patch(':id/reject')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async reject(
    @Param('id') id: string,
    @Body() rejectMandateDto: any,
    @CurrentUser() user: any,
  ) {
    return this.mandatesService.reject(id, user, rejectMandateDto);
  }

  @Get(':id/pdf')
  async generatePdf(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.mandatesService.generatePdf(id, user);
  }
}
```

### Service des Mandats

```typescript
// src/modules/mandates/mandates.service.ts
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mandate } from '../../entities/mandate.entity';
import { User } from '../../entities/user.entity';
import { CreateMandateDto } from './dto/create-mandate.dto';
import { ApproveMandateDto } from './dto/approve-mandate.dto';
import { EmailService } from '../email/email.service';
import { AuditService } from '../security/audit.service';
import { EncryptionService } from '../security/encryption.service';

@Injectable()
export class MandatesService {
  constructor(
    @InjectRepository(Mandate)
    private mandatesRepository: Repository<Mandate>,
    private emailService: EmailService,
    private auditService: AuditService,
    private encryptionService: EncryptionService,
  ) {}

  async create(createMandateDto: CreateMandateDto, clientId: string): Promise<Mandate> {
    // Validation des données
    await this.validateMandateData(createMandateDto);

    // Chiffrement des données sensibles
    const encryptedData = this.encryptionService.encrypt(
      JSON.stringify(createMandateDto.data),
    );

    const mandate = this.mandatesRepository.create({
      ...createMandateDto,
      clientId,
      formData: encryptedData,
      referenceNumber: await this.generateReferenceNumber(),
      status: 'pending_validation',
    });

    const savedMandate = await this.mandatesRepository.save(mandate);

    // Audit et notification
    await this.auditService.logMandateCreated(savedMandate.id, clientId);
    await this.emailService.sendMandateCreatedEmail(savedMandate);

    return savedMandate;
  }

  async findAll(query: any, user: any): Promise<{ data: Mandate[]; total: number }> {
    const { page = 1, limit = 10, status, search } = query;
    const skip = (page - 1) * limit;

    const qb = this.mandatesRepository.createQueryBuilder('mandate')
      .leftJoinAndSelect('mandate.client', 'client');

    // Filtrage par rôle
    if (user.role === 'client') {
      qb.where('mandate.clientId = :clientId', { clientId: user.id });
    }

    // Filtres optionnels
    if (status) {
      qb.andWhere('mandate.status = :status', { status });
    }

    if (search) {
      qb.andWhere('(mandate.title ILIKE :search OR mandate.referenceNumber ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    const [data, total] = await qb
      .orderBy('mandate.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: string, user: any): Promise<Mandate> {
    const mandate = await this.mandatesRepository.findOne({
      where: { id },
      relations: ['client', 'adminApprover', 'superAdminApprover'],
    });

    if (!mandate) {
      throw new NotFoundException('Mandat non trouvé');
    }

    // Vérification des permissions
    if (user.role === 'client' && mandate.clientId !== user.id) {
      throw new ForbiddenException('Accès non autorisé à ce mandat');
    }

    // Déchiffrement des données
    if (mandate.formData) {
      mandate.formData = JSON.parse(
        this.encryptionService.decrypt(mandate.formData),
      );
    }

    return mandate;
  }

  async approve(id: string, user: any, approveDto: ApproveMandateDto): Promise<Mandate> {
    const mandate = await this.mandatesRepository.findOne({ where: { id } });

    if (!mandate) {
      throw new NotFoundException('Mandat non trouvé');
    }

    // Logique de validation hiérarchique
    if (user.role === 'admin' && mandate.status === 'pending_validation') {
      mandate.status = 'admin_approved';
      mandate.adminApproverId = user.id;
      mandate.adminApprovedAt = new Date();
    } else if (user.role === 'super_admin' && mandate.status === 'admin_approved') {
      mandate.status = 'super_admin_approved';
      mandate.superAdminApproverId = user.id;
      mandate.superAdminApprovedAt = new Date();

      // Générer le PDF et envoyer l'email
      await this.generateAndSendPdf(mandate);
    } else {
      throw new BadRequestException('Action de validation non autorisée');
    }

    const updatedMandate = await this.mandatesRepository.save(mandate);

    await this.auditService.logMandateApproved(id, user.id, user.role);

    return updatedMandate;
  }

  async reject(id: string, user: any, rejectDto: any): Promise<void> {
    const mandate = await this.mandatesRepository.findOne({ where: { id } });

    if (!mandate) {
      throw new NotFoundException('Mandat non trouvé');
    }

    mandate.status = 'rejected';
    mandate.rejectionReason = rejectDto.reason;
    mandate.rejectedAt = new Date();

    if (user.role === 'admin') {
      mandate.adminApproverId = user.id;
    } else if (user.role === 'super_admin') {
      mandate.superAdminApproverId = user.id;
    }

    await this.mandatesRepository.save(mandate);
    await this.auditService.logMandateRejected(id, user.id, user.role);
    await this.emailService.sendMandateRejectedEmail(mandate, rejectDto.reason);
  }

  private async generateReferenceNumber(): Promise<string> {
    const timestamp = Date.now().
# Architecture Système et Sécurité Avancée

## Architecture en Couches Sécurisée

### 1. Présentation (Frontend Next.js)
```typescript
// Structure sécurisée des composants
src/
├── app/
│   ├── (public)/           # Routes publiques
│   ├── (protected)/        # Routes protégées
│   │   ├── client/
│   │   ├── admin/
│   │   └── super-admin/
│   └── api/               # API routes Next.js
├── components/
│   ├── ui/                # Composants UI de base
│   ├── forms/             # Formulaires sécurisés
│   └── auth/              # Composants d'authentification
└── lib/
    ├── auth.ts            # Logique d'authentification
    ├── security.ts        # Utilitaires de sécurité
    └── validation.ts      # Validation côté client
```

### 2. Application (Backend NestJS)
```typescript
// Architecture modulaire sécurisée
src/
├── modules/
│   ├── auth/
│   │   ├── guards/        # JwtAuthGuard, RolesGuard
│   │   ├── strategies/    # JwtStrategy, LocalStrategy
│   │   └── decorators/    # @Public(), @Roles()
│   ├── security/
│   │   ├── interceptors/  # Logging, Transform, Cache
│   │   ├── filters/       # Exception filters
│   │   └── middleware/    # Security middleware
│   └── core/              # Services centraux
├── common/
│   ├── decorators/        # Custom decorators
│   ├── pipes/             # Validation pipes
│   └── interfaces/        # Types et interfaces
└── config/                # Configuration sécurisée
```

## Mesures de Sécurité Détaillées

### 1. Authentification Multi-Facteurs

#### JWT Sécurisé
```typescript
// Configuration JWT avancée
const jwtConfig = {
  accessToken: {
    expiresIn: '15m',      // Court pour la sécurité
    secret: process.env.JWT_ACCESS_SECRET,
  },
  refreshToken: {
    expiresIn: '7d',       // Long pour le confort
    secret: process.env.JWT_REFRESH_SECRET,
    rotation: true,        // Rotation automatique
  }
};

// Validation des tokens
interface JwtPayload {
  userId: string;
  role: UserRole;
  sessionId: string;       // Pour invalidation par session
  iat: number;
  exp: number;
}
```

#### 2FA (Authentification à Deux Facteurs)
```typescript
// Service 2FA
@Injectable()
export class TwoFactorService {
  async generateSecret(user: User): Promise<string> {
    const secret = authenticator.generateSecret();
    await this.usersService.setTwoFactorSecret(user.id, secret);
    return authenticator.keyuri(user.email, 'MandatApp', secret);
  }

  async verifyToken(user: User, token: string): Promise<boolean> {
    const secret = await this.usersService.getTwoFactorSecret(user.id);
    return authenticator.verify({ token, secret });
  }
}
```

### 2. Protection des Données

#### Chiffrement des Données Sensibles
```typescript
// Service de chiffrement
@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

  encrypt(text: string): { encrypted: string; authTag: string; iv: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    cipher.setAAD(Buffer.from('mandat-app'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      authTag: cipher.getAuthTag().toString('hex'),
      iv: iv.toString('hex')
    };
  }

  decrypt(encryptedData: { encrypted: string; authTag: string; iv: string }): string {
    const decipher = crypto.createDecipher(
      this.algorithm, 
      this.key, 
      Buffer.from(encryptedData.iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    decipher.setAAD(Buffer.from('mandat-app'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

#### Hachage des Mots de Passe
```typescript
// Service de hachage sécurisé
@Injectable()
export class PasswordService {
  private readonly saltRounds = 12;

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async isPasswordCompromised(password: string): Promise<boolean> {
    // Vérification contre les bases de données de mots de passe compromis
    const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);
    
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    const data = await response.text();
    
    return data.includes(suffix);
  }
}
```

### 3. Sécurité Réseau et API

#### Rate Limiting Avancé
```typescript
// Configuration du rate limiting
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: {
    general: 100,           // Requêtes générales
    auth: 5,               // Tentatives de connexion
    mandates: 10,          // Création de mandats
    admin: 50              // Actions admin
  },
  skipSuccessfulRequests: false,
  message: 'Trop de requêtes, veuillez réessayer plus tard.'
};

// Middleware de rate limiting par type
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const key = this.getRateLimitKey(req);
    const limit = this.getRateLimit(req);
    
    // Implémentation du compteur
    this.incrementCounter(key).then(count => {
      if (count > limit) {
        res.status(429).json({
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil(rateLimitConfig.windowMs / 1000)
        });
        return;
      }
      next();
    });
  }
}
```

#### Protection CSRF
```typescript
// Configuration CSRF
const csrfConfig = {
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  value: (req: Request) => req.headers['x-csrf-token'],
};

// Middleware CSRF personnalisé
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Génération et validation des tokens CSRF
    if (req.method === 'GET') {
      const token = this.generateToken();
      res.cookie('csrf-token', token, csrfConfig.cookie);
      res.locals.csrfToken = token;
    } else if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const token = req.headers['x-csrf-token'];
      const cookieToken = req.cookies['csrf-token'];
      
      if (!token || token !== cookieToken) {
        throw new ForbiddenException('Token CSRF invalide');
      }
    }
    next();
  }
}
```

### 4. Validation et Sanitisation

#### Validation des Entrées
```typescript
// DTOs de validation sécurisés
export class CreateMandateDto {
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  @Matches(/^[a-zA-Z0-9\s\-_]+$/) // Caractères autorisés uniquement
  title: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  @IsSafeHtml() // Validation HTML sécurisé
  description: string;

  @IsObject()
  @ValidateNested()
  data: Record<string, any>;

  @IsEmail()
  @MaxLength(255)
  clientEmail: string;
}

// Pipe de validation personnalisé
@Injectable()
export class SecurityValidationPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {
    // Validation standard
    const validatedValue = await super.transform(value, metadata);
    
    // Sanitisation supplémentaire
    return this.sanitize(validatedValue);
  }

  private sanitize(value: any): any {
    if (typeof value === 'string') {
      return DOMPurify.sanitize(value);
    }
    if (typeof value === 'object' && value !== null) {
      for (const key in value) {
        value[key] = this.sanitize(value[key]);
      }
    }
    return value;
  }
}
```

### 5. Monitoring et Audit

#### Système de Logs Sécurisé
```typescript
// Service d'audit complet
@Injectable()
export class AuditService {
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    const logEntry = {
      timestamp: new Date(),
      userId: event.userId,
      action: event.action,
      resource: event.resource,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      severity: event.severity,
      details: event.details,
      metadata: event.metadata
    };

    // Stockage dans base de données sécurisée
    await this.auditRepository.save(logEntry);
    
    // Alertes pour événements critiques
    if (event.severity === 'high') {
      await this.sendSecurityAlert(logEntry);
    }
  }

  async getSuspiciousActivities(userId: string): Promise<SuspiciousActivity[]> {
    // Détection d'activités suspectes
    const recentActivities = await this.auditRepository.find({
      where: { userId },
      order: { timestamp: 'DESC' },
      take: 100
    });

    return this.analyzeForSuspiciousPatterns(recentActivities);
  }
}
```

#### Types d'Événements d'Audit
```typescript
interface SecurityEvent {
  userId: string;
  action: SecurityAction;
  resource: string;
  ipAddress: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high';
  details: string;
  metadata?: Record<string, any>;
}

type SecurityAction = 
  | 'login_success'
  | 'login_failed'
  | 'password_change'
  | 'role_change'
  | 'mandate_created'
  | 'mandate_approved'
  | 'mandate_rejected'
  | 'user_created'
  | 'user_modified'
  | 'security_alert';
```

### 6. Configuration de Sécurité

#### Variables d'Environnement Sécurisées
```env
# Authentification
JWT_ACCESS_SECRET=super_secret_access_key_32_chars
JWT_REFRESH_SECRET=super_secret_refresh_key_32_chars
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Chiffrement
ENCRYPTION_KEY=64_char_hex_encryption_key_for_aes_256
DATA_ENCRYPTION_IV=16_char_hex_iv

# Base de données
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# Email
SMTP_HOST=smtp.secure.com
SMTP_PORT=587
SMTP_USER=user
SMTP_PASS=pass

# Sécurité
ALLOWED_ORIGINS=https://votredomaine.com
RATE_LIMIT_WINDOW=900000
MAX_LOGIN_ATTEMPTS=5
SESSION_TIMEOUT=3600000
```

#### Configuration NestJS Sécurisée
```typescript
// app.module.ts - Configuration principale
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        JWT_ACCESS_SECRET: Joi.string().required().min(32),
        JWT_REFRESH_SECRET: Joi.string().required().min(32),
      }),
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    HelmetModule.forRoot(),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SecurityHeadersInterceptor,
    },
  ],
})
export class AppModule {}
```

## Stratégie de Déploiement Sécurisé

### 1. Environnement de Production
- **Reverse Proxy**: Nginx avec configuration sécurité
- **SSL/TLS**: Certificats Let's Encrypt avec HSTS
- **Firewall**: Rules restrictives (ports 80, 443 uniquement)
- **WAF**: Web Application Firewall

### 2. Monitoring Continu
- **Logs**: Centralisés avec ELK Stack
- **Métriques**: Prometheus + Grafana
- **Alertes**: Slack/Email pour incidents sécurité
- **Backups**: Automatiques et chiffrés

### 3. Procédures d'Urgence
- **Incident Response**: Plan détaillé
- **Rollback**: Déploiement rapide
- **Communication**: Protocole de crise
- **Post-Mortem**: Analyse des incidents

Cette architecture garantit une sécurité maximale à chaque niveau de l'application, depuis le frontend jusqu'à la base de données.
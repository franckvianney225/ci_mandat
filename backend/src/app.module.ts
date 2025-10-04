import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import * as Joi from 'joi';

// Configuration
import typeOrmConfig from './config/database.config';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MandatesModule } from './modules/mandates/mandates.module';
import { SettingsModule } from './modules/settings/settings.module';
import { EmailModule } from './modules/email/email.module';
import { PdfModule } from './modules/pdf/pdf.module';
import { SecurityModule } from './modules/security/security.module';
import { VerificationModule } from './modules/verification/verification.module';
import { RedisModule } from './modules/redis/redis.module';

// Guards et Intercepteurs
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    // Configuration de l'environnement
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      validationSchema: Joi.object({
        // Environnement
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3001),

        // Base de données
        DATABASE_URL: Joi.string().required(),

        // Authentification JWT
        JWT_ACCESS_SECRET: Joi.string().required().min(32),
        JWT_REFRESH_SECRET: Joi.string().required().min(32),
        JWT_ACCESS_EXPIRES: Joi.string().default('15m'),
        JWT_REFRESH_EXPIRES: Joi.string().default('7d'),

        // Chiffrement
        ENCRYPTION_KEY: Joi.string().required().length(64),
        DATA_ENCRYPTION_IV: Joi.string().required().length(32),

        // Email
        SMTP_HOST: Joi.string().required(),
        SMTP_PORT: Joi.number().required(),
        SMTP_USER: Joi.string().required(),
        SMTP_PASS: Joi.string().required(),
        EMAIL_FROM: Joi.string().email().required(),

        // Sécurité
        ALLOWED_ORIGINS: Joi.string().default('http://localhost:3000'),
        RATE_LIMIT_WINDOW: Joi.number().default(900000),
        MAX_LOGIN_ATTEMPTS: Joi.number().default(5),
        SESSION_TIMEOUT: Joi.number().default(3600000),

        // URLs
        FRONTEND_URL: Joi.string().uri().required(),
        BACKEND_URL: Joi.string().uri().required(),

        // Redis
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),
        REDIS_PASSWORD: Joi.string().optional(),

        // Logging
        LOG_LEVEL: Joi.string()
          .valid('error', 'warn', 'info', 'debug')
          .default('info'),
      }),
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'global',
          ttl: 60000, // 1 minute
          limit: 100, // 100 requêtes par minute pour les endpoints généraux
        },
        {
          name: 'mandate-creation',
          ttl: 60000, // 1 minute
          limit: 5, // 5 créations de mandat par minute par IP
        },
        {
          name: 'auth',
          ttl: 60000, // 1 minute
          limit: 10, // 10 tentatives de connexion par minute
        },
      ],
    }),

    // Base de données
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...typeOrmConfig,
        url: config.get<string>('DATABASE_URL'),
        synchronize: config.get<string>('NODE_ENV') === 'development',
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),

    // JWT Module
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_ACCESS_EXPIRES', '15m'),
          issuer: 'ci-mandat-app',
          audience: 'ci-mandat-users',
        },
      }),
    }),

    // Modules fonctionnels
    AuthModule,
    UsersModule,
    MandatesModule,
    SettingsModule,
    EmailModule,
    PdfModule,
    SecurityModule,
    VerificationModule,
    RedisModule,
  ],
  providers: [
    // Guards globaux
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const jwt_1 = require("@nestjs/jwt");
const Joi = require("joi");
const database_config_1 = require("./config/database.config");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const mandates_module_1 = require("./modules/mandates/mandates.module");
const settings_module_1 = require("./modules/settings/settings.module");
const email_module_1 = require("./modules/email/email.module");
const pdf_module_1 = require("./modules/pdf/pdf.module");
const security_module_1 = require("./modules/security/security.module");
const verification_module_1 = require("./modules/verification/verification.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
                validationSchema: Joi.object({
                    NODE_ENV: Joi.string()
                        .valid('development', 'production', 'test')
                        .default('development'),
                    PORT: Joi.number().default(3001),
                    DATABASE_URL: Joi.string().required(),
                    JWT_ACCESS_SECRET: Joi.string().required().min(32),
                    JWT_REFRESH_SECRET: Joi.string().required().min(32),
                    JWT_ACCESS_EXPIRES: Joi.string().default('15m'),
                    JWT_REFRESH_EXPIRES: Joi.string().default('7d'),
                    ENCRYPTION_KEY: Joi.string().required().length(64),
                    DATA_ENCRYPTION_IV: Joi.string().required().length(32),
                    SMTP_HOST: Joi.string().required(),
                    SMTP_PORT: Joi.number().required(),
                    SMTP_USER: Joi.string().required(),
                    SMTP_PASS: Joi.string().required(),
                    EMAIL_FROM: Joi.string().email().required(),
                    ALLOWED_ORIGINS: Joi.string().default('http://localhost:3000'),
                    RATE_LIMIT_WINDOW: Joi.number().default(900000),
                    MAX_LOGIN_ATTEMPTS: Joi.number().default(5),
                    SESSION_TIMEOUT: Joi.number().default(3600000),
                    FRONTEND_URL: Joi.string().uri().required(),
                    BACKEND_URL: Joi.string().uri().required(),
                    LOG_LEVEL: Joi.string()
                        .valid('error', 'warn', 'info', 'debug')
                        .default('info'),
                }),
                validationOptions: {
                    allowUnknown: true,
                    abortEarly: false,
                },
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => [
                    {
                        ttl: config.get('RATE_LIMIT_WINDOW', 900000),
                        limit: 100,
                    },
                ],
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    ...database_config_1.default,
                    url: config.get('DATABASE_URL'),
                    synchronize: config.get('NODE_ENV') === 'development',
                    logging: config.get('NODE_ENV') === 'development',
                }),
            }),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    secret: config.get('JWT_ACCESS_SECRET'),
                    signOptions: {
                        expiresIn: config.get('JWT_ACCESS_EXPIRES', '15m'),
                        issuer: 'ci-mandat-app',
                        audience: 'ci-mandat-users',
                    },
                }),
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            mandates_module_1.MandatesModule,
            settings_module_1.SettingsModule,
            email_module_1.EmailModule,
            pdf_module_1.PdfModule,
            security_module_1.SecurityModule,
            verification_module_1.VerificationModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
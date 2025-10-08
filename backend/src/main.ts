import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import * as csurf from 'csurf';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Configuration de sécurité avec Helmet
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`],
        scriptSrc: [`'self'`],
        imgSrc: [`'self'`, 'data:'],
        fontSrc: [`'self'`],
        connectSrc: [`'self'`],
        frameSrc: [`'none'`],
        objectSrc: [`'none'`],
        baseUri: [`'self'`],
        formAction: [`'self'`],
      },
    },
  }));

  // Compression des réponses
  app.use(compression());

  // Limites de taille pour les requêtes
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ limit: '1mb', extended: true }));

  // Parser des cookies
  app.use(cookieParser());

  // Protection CSRF - Exclure les endpoints d'authentification
  app.use((req, res, next) => {
    // Exclure les endpoints d'authentification du CSRF
    const excludedPaths = [
      '/api/v1/auth/login',
      '/api/v1/auth/logout',
      '/api/v1/auth/verify',
      '/api/v1/mandates'
    ];
    
    if (excludedPaths.some(path => req.path.startsWith(path))) {
      return next();
    }
    
    // Appliquer CSRF uniquement aux autres endpoints
    return csurf({
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      }
    })(req, res, next);
  });

  // Validation globale des données sécurisée
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true, // Activer pour rejeter les propriétés non autorisées
      transform: true,
      forbidUnknownValues: true,
      validationError: { target: false },
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Configuration CORS
  const allowedOrigins = configService.get<string>('ALLOWED_ORIGINS')?.split(',') || [];
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-CSRF-Token',
      'x-recaptcha-token',
    ],
    exposedHeaders: ['x-recaptcha-token'],
  });

  // Configuration Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle('CI-Mandat API')
    .setDescription('API sécurisée pour la gestion des mandats')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addSecurityRequirements('JWT-auth')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Configuration du préfixe global
  app.setGlobalPrefix('api/v1');

  const port = configService.get<number>('PORT') || 3001;
  
  await app.listen(port);
  
  console.log(`🚀 Application démarrée sur le port ${port}`);
  console.log(`📚 Documentation API disponible sur: http://localhost:${port}/api/docs`);
  console.log(`🌍 Environnement: ${configService.get('NODE_ENV')}`);
}

bootstrap().catch((error) => {
  console.error('Erreur lors du démarrage de l\'application:', error);
  process.exit(1);
});
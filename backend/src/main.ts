import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
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
        styleSrc: [`'self'`, `'unsafe-inline'`],
        imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
        scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
      },
    },
  }));

  // Compression des réponses
  app.use(compression());

  // Parser des cookies
  app.use(cookieParser());

  // Validation globale des données
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
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
    ],
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
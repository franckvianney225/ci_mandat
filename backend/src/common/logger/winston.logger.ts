import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WinstonLogger implements LoggerService {
  private logger: winston.Logger;

  constructor(private configService: ConfigService) {
    const logLevel = this.configService.get<string>('LOG_LEVEL', 'info');
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    const logsDir = this.configService.get<string>('LOGS_DIR', 'logs');
    
    // En production/Docker, utiliser uniquement la console pour éviter les problèmes de permissions
    const isDocker = process.env.NODE_ENV === 'production' || process.env.DOCKER === 'true';
    
    // Configuration des transports
    const transports: winston.transport[] = [];

    // Transport console pour tous les environnements
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp(),
          winston.format.printf(({ timestamp, level, message, context, trace, ...meta }) => {
            const contextStr = context ? ` [${context}]` : '';
            const traceStr = trace ? `\n${trace}` : '';
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} ${level}${contextStr}: ${message}${metaStr}${traceStr}`;
          })
        ),
      })
    );

    // Transport fichier uniquement si PAS en Docker et en production
    if (nodeEnv === 'production' && !isDocker) {
      try {
        const fs = require('fs');
        if (!fs.existsSync(logsDir)) {
          fs.mkdirSync(logsDir, { recursive: true });
        }
        
        transports.push(
          new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json()
            ),
          }),
          new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json()
            ),
          })
        );
      } catch (error) {
        console.warn(`Impossible de configurer les logs fichiers: ${error.message}`);
      }
    }

    // Transport fichier HTTP uniquement si PAS en Docker
    if (!isDocker) {
      try {
        const fs = require('fs');
        if (!fs.existsSync(logsDir)) {
          fs.mkdirSync(logsDir, { recursive: true });
        }
        
        transports.push(
          new winston.transports.File({
            filename: path.join(logsDir, 'http.log'),
            level: 'http',
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json()
            ),
          })
        );
      } catch (error) {
        console.warn(`Impossible de configurer le log HTTP: ${error.message}`);
      }
    }


    this.logger = winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: {
        service: 'ci-mandat-api',
        environment: nodeEnv,
      },
      transports,
    });
  }

  log(message: string, context?: string, meta?: any) {
    this.logger.info(message, { context, ...meta });
  }

  error(message: string, trace?: string, context?: string, meta?: any) {
    this.logger.error(message, { context, trace, ...meta });
  }

  warn(message: string, context?: string, meta?: any) {
    this.logger.warn(message, { context, ...meta });
  }

  debug(message: string, context?: string, meta?: any) {
    this.logger.debug(message, { context, ...meta });
  }

  verbose(message: string, context?: string, meta?: any) {
    this.logger.verbose(message, { context, ...meta });
  }

  http(message: string, meta?: any) {
    this.logger.http(message, meta);
  }
}
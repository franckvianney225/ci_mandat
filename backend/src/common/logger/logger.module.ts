import { Module, Global, LoggerService } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WinstonLogger } from './winston.logger';

// Logger simplifié pour Docker qui n'utilise pas Winston
class DockerConsoleLogger implements LoggerService {
  log(message: string, context?: string) {
    console.log(`[${context || 'App'}] ${message}`);
  }

  error(message: string, trace?: string, context?: string) {
    console.error(`[${context || 'App'}] ERROR: ${message}`, trace || '');
  }

  warn(message: string, context?: string) {
    console.warn(`[${context || 'App'}] WARN: ${message}`);
  }

  debug(message: string, context?: string) {
    console.debug(`[${context || 'App'}] DEBUG: ${message}`);
  }

  verbose(message: string, context?: string) {
    console.log(`[${context || 'App'}] VERBOSE: ${message}`);
  }
}

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: WinstonLogger,
      useFactory: (configService: ConfigService) => {
        // En Docker/production, utiliser le logger console simplifié
        const isDocker = process.env.NODE_ENV === 'production' || process.env.DOCKER === 'true';
        if (isDocker) {
          return new DockerConsoleLogger() as any;
        }
        return new WinstonLogger(configService);
      },
      inject: [ConfigService],
    },
  ],
  exports: [WinstonLogger],
})
export class LoggerModule {}
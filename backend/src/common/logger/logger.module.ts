import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WinstonLogger } from './winston.logger';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: WinstonLogger,
      useFactory: (configService: ConfigService) => {
        return new WinstonLogger(configService);
      },
      inject: [ConfigService],
    },
  ],
  exports: [WinstonLogger],
})
export class LoggerModule {}
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailConfigEntity } from '../../entities/email-config.entity';
import { EmailService } from './email.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailConfigEntity]),
    SettingsModule,
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
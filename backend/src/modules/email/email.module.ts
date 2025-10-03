import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailConfigEntity } from '../../entities/email-config.entity';
import { EmailService } from './email.service';
import { SettingsService } from '../settings/settings.service';

@Module({
  imports: [TypeOrmModule.forFeature([EmailConfigEntity])],
  providers: [EmailService, SettingsService],
  exports: [EmailService],
})
export class EmailModule {}
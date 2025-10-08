import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { EmailConfigEntity } from '../../entities/email-config.entity';
import { SystemConfigEntity } from '../../entities/system-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EmailConfigEntity, SystemConfigEntity])],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { EmailConfigEntity } from '../../entities/email-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EmailConfigEntity])],
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
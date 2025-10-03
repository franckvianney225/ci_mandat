import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MandatesService } from './mandates.service';
import { MandatesController } from './mandates.controller';
import { Mandate } from '../../entities/mandate.entity';
import { User } from '../../entities/user.entity';
import { SettingsModule } from '../settings/settings.module';
import { EmailModule } from '../email/email.module';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Mandate, User]),
    SettingsModule,
    EmailModule,
    PdfModule,
  ],
  controllers: [MandatesController],
  providers: [MandatesService],
  exports: [MandatesService],
})
export class MandatesModule {}
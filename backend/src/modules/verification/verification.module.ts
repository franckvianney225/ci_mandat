import { Module } from '@nestjs/common';
import { VerificationController } from './verification.controller';
import { MandatesModule } from '../mandates/mandates.module';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [MandatesModule, SecurityModule],
  controllers: [VerificationController],
})
export class VerificationModule {}
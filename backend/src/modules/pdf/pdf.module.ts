import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { PdfController } from './pdf.controller';
import { SecurityModule } from '../security/security.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [SecurityModule, RedisModule],
  providers: [PdfService],
  controllers: [PdfController],
  exports: [PdfService],
})
export class PdfModule {}
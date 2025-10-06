import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { PdfController } from './pdf.controller';
import { SecurityModule } from '../security/security.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [SecurityModule, CacheModule],
  providers: [PdfService],
  controllers: [PdfController],
  exports: [PdfService],
})
export class PdfModule {}
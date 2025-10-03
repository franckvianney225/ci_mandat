import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [SecurityModule],
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {}
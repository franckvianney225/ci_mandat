import { Controller, Get, Post, Body, Param, Res, Logger, Query } from '@nestjs/common';
import { Response } from 'express';
import { PdfService } from './pdf.service';
import { Mandate } from '../../entities/mandate.entity';

@Controller('pdf')
export class PdfController {
  private readonly logger = new Logger(PdfController.name);

  constructor(private readonly pdfService: PdfService) {}

  /**
   * Génère un PDF de mandat de manière asynchrone
   */
  @Post('generate')
  async generatePDFAsync(@Body() mandate: Mandate) {
    try {
      this.logger.log(`Démarrage de la génération asynchrone PDF pour mandat: ${mandate.id}`);
      const result = await this.pdfService.generateMandatePDFAsync(mandate);
      return {
        success: true,
        jobId: result.jobId,
        message: 'Génération PDF démarrée'
      };
    } catch (error) {
      this.logger.error(`Erreur lors du démarrage de la génération PDF pour ${mandate.id}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Récupère le statut d'une génération PDF
   */
  @Get('status/:jobId')
  async getPDFStatus(@Param('jobId') jobId: string) {
    try {
      const status = await this.pdfService.getPDFGenerationStatus(jobId);
      
      if (!status) {
        return {
          success: false,
          error: 'Job non trouvé ou expiré'
        };
      }

      return {
        success: true,
        status: status.status,
        data: status.data,
        timestamp: status.timestamp
      };
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération du statut pour job ${jobId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Récupère un PDF depuis le cache
   */
  @Get('cache/:referenceNumber')
  async getCachedPDF(
    @Param('referenceNumber') referenceNumber: string,
    @Res() res: Response
  ) {
    try {
      this.logger.log(`Tentative de récupération PDF en cache pour: ${referenceNumber}`);
      const cachedPDF = await this.pdfService.getCachedPDF(referenceNumber);
      
      if (!cachedPDF) {
        return res.status(404).json({
          success: false,
          error: 'PDF non trouvé en cache'
        });
      }

      // Configurer les headers pour le téléchargement
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${cachedPDF.fileName}"`,
        'Content-Length': cachedPDF.pdfBuffer.length,
        'Cache-Control': 'public, max-age=86400' // Cache 24h
      });

      // Envoyer le PDF
      res.send(cachedPDF.pdfBuffer);
      
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération du PDF en cache pour ${referenceNumber}:`, error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  /**
   * Génère et télécharge un PDF immédiatement (méthode synchrone existante)
   */
  @Post('generate-sync')
  async generatePDFSync(@Body() mandate: Mandate, @Res() res: Response) {
    try {
      this.logger.log(`Génération PDF synchrone pour mandat: ${mandate.id}`);
      const { pdfBuffer, fileName } = await this.pdfService.generateMandatePDF(mandate);

      // Mettre en cache pour les prochaines requêtes
      await this.pdfService.generateMandatePDFAsync(mandate);

      // Configurer les headers pour le téléchargement
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length,
        'Cache-Control': 'public, max-age=86400'
      });

      // Envoyer le PDF
      res.send(pdfBuffer);
      
    } catch (error) {
      this.logger.error(`Erreur lors de la génération PDF synchrone pour ${mandate.id}:`, error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  /**
   * Supprime un PDF du cache
   */
  @Post('cache/:referenceNumber/delete')
  async deleteCachedPDF(@Param('referenceNumber') referenceNumber: string) {
    try {
      await this.pdfService.deleteCachedPDF(referenceNumber);
      return {
        success: true,
        message: `PDF supprimé du cache pour: ${referenceNumber}`
      };
    } catch (error) {
      this.logger.error(`Erreur lors de la suppression du PDF en cache pour ${referenceNumber}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Vérifie si un PDF est en cache
   */
  @Get('cache/:referenceNumber/exists')
  async checkCachedPDF(@Param('referenceNumber') referenceNumber: string) {
    try {
      const cachedPDF = await this.pdfService.getCachedPDF(referenceNumber);
      return {
        success: true,
        exists: !!cachedPDF,
        referenceNumber
      };
    } catch (error) {
      this.logger.error(`Erreur lors de la vérification du cache pour ${referenceNumber}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }
}
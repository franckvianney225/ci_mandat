import { Injectable, Logger } from '@nestjs/common';
import { jsPDF } from 'jspdf';
import { Mandate } from '../../entities/mandate.entity';
import { SecurityService } from '../security/security.service';
import { CacheService } from '../cache/cache.service';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  constructor(
    private securityService: SecurityService,
    private cacheService: CacheService,
  ) {}

  /**
   * Charge le logo en base64
   */
  private loadLogo(): string {
    try {
      const logoPath = path.join(__dirname, '..', '..', 'assets', 'logorhdp.jpeg');
      const logoBuffer = fs.readFileSync(logoPath);
      const base64String = logoBuffer.toString('base64');
      return `data:image/jpeg;base64,${base64String}`;
    } catch (error) {
      this.logger.warn('Impossible de charger le logo, utilisation du cercle jaune par défaut');
      return '';
    }
  }

  /**
   * Ajoute un filigrane de sécurité OFFICIEL répété sur toute la page
   */
  private addSecurityWatermark(doc: jsPDF, pageWidth: number, pageHeight: number): void {
    // Configuration du filigrane
    doc.setTextColor(245, 245, 245); // Gris très clair
    doc.setFontSize(36);
    doc.setFont('helvetica', 'bold');

    // Texte du filigrane
    const watermarkText = 'OFFICIEL';

    // Rotation et positionnement diagonal
    const angle = -45;

    // Espacement très serré pour couverture maximale PARTOUT
    const stepX = 60;
    const stepY = 45;

    // Créer un pattern ultra-dense répété sur TOUTE la page
    for (let x = -20; x < pageWidth + 20; x += stepX) {
      for (let y = -20; y < pageHeight + 20; y += stepY) {
        doc.text(watermarkText, x, y, {
          angle: angle,
          align: 'left'
        });
      }
    }
  }

  /**
   * Génère un PDF de mandat avec QR code de vérification
   */
  async generateMandatePDF(mandate: Mandate): Promise<{ pdfBuffer: Buffer; fileName: string }> {
    try {
      this.logger.log(`Génération du PDF pour le mandat: ${mandate.id}`);

      const doc = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Ajouter le filigrane de sécurité OFFICIEL répété partout
      this.addSecurityWatermark(doc, pageWidth, pageHeight);

      // Générer le QR code
      const qrCodeBuffer = await this.securityService.generateQRCodeBuffer(mandate);
      
      // Couleurs
      const primaryColor: [number, number, number] = [0, 0, 0]; // Noir
      const secondaryColor: [number, number, number] = [52, 73, 94]; // Gris foncé
      const yellowColor: [number, number, number] = [255, 215, 0]; // Jaune CEI
      
      // Position Y courante
      let yPos = 20;

      // En-tête avec logos
      // Logo CEI à gauche
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      
      // Logo CEI
      const logoDataUrl = this.loadLogo();
      if (logoDataUrl) {
        const logoWidth = 25;
        const logoHeight = 25;
        const logoX = 20;
        const logoY = yPos + 10;
        doc.addImage(logoDataUrl, 'JPEG', logoX, logoY, logoWidth, logoHeight);
      } else {
        // Fallback au cercle jaune si le logo ne peut pas être chargé
        doc.setFillColor(...yellowColor);
        doc.circle(35, yPos + 15, 8, 'F');
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.text('CEI', 32, yPos + 17);
      }
      
      // Texte sous le logo
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('CURESS', 20, yPos + 38);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('L\'Espérance au Service du Peuple', 20, yPos + 42);
      
      // République à droite
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);

      // Texte principal aligné à droite
      const republiqueText = 'RÉPUBLIQUE DE CÔTE D\'IVOIRE';
      doc.text(republiqueText, pageWidth - 20, yPos, { align: 'right' });

      // Calculer la largeur du texte pour centrer le texte en dessous
      const republiqueTextWidth = doc.getTextWidth(republiqueText);
      const republiqueStartX = pageWidth - 20 - republiqueTextWidth;

      // Texte en dessous centré
      doc.setFontSize(9);
      const unionText = 'Union-Discipline-Travail';
      const unionTextWidth = doc.getTextWidth(unionText);
      const unionStartX = republiqueStartX + (republiqueTextWidth - unionTextWidth) / 2;
      doc.text(unionText, unionStartX, yPos + 5);
      
      yPos += 50;

      // Titre principal avec bordure
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      
      // Rectangle de bordure
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(2);
      doc.rect(30, yPos, pageWidth - 60, 25);
      
      // Texte dans le rectangle
      doc.text('ÉLECTION PRESIDENTIELLE', pageWidth / 2, yPos + 10, { align: 'center' });
      doc.setFontSize(14);
      doc.setTextColor(30, 64, 175); // Bleu
      doc.text('SCRUTIN DU 25 OCTOBRE 2025', pageWidth / 2, yPos + 18, { align: 'center' });
      
      yPos += 40;

      // Sous-titre
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('MANDAT DU REPRÉSENTANT PRINCIPAL', pageWidth / 2, yPos, { align: 'center' });
      doc.text('DANS LE BUREAU DE VOTE', pageWidth / 2, yPos + 6, { align: 'center' });
      
      yPos += 20;

      // Corps du document
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...primaryColor);
      
      const lineHeight = 6;
      const leftMargin = 30;
      const rightMargin = pageWidth - 30;
      const textWidth = rightMargin - leftMargin;

      // Paragraphe principal avec le nouveau contenu
      const ligne1 = 'Conformément aux dispositions des articles 35 nouveau et 38 du Code électoral, Monsieur ';
      doc.text(ligne1, leftMargin, yPos, { maxWidth: textWidth });

      // "Alassane Ouattara" en gras sur la même ligne
      doc.setFont('helvetica', 'bold');
      const candidateName = 'ALASSANE OUATTARA';
      const ligne1Width = doc.getTextWidth(ligne1);
      doc.text(candidateName, leftMargin + ligne1Width, yPos);

      // Suite de la première ligne
      doc.setFont('helvetica', 'normal');
      const ligne1Suite = ', candidat à l\'élection présidentielle du 25 octobre 2025,';
      doc.text(ligne1Suite, leftMargin + ligne1Width + doc.getTextWidth(candidateName + ' '), yPos);

      yPos += lineHeight;

      // Deuxième ligne
      const ligne2 = 'donne mandat à Mme/M. ';
      doc.text(ligne2, leftMargin, yPos);

      // Nom du mandataire en gras
      doc.setFont('helvetica', 'bold');
      const mandataireNom = `${mandate.formData.prenom.toUpperCase()} ${mandate.formData.nom.toUpperCase()}`;
      const ligne2Width = doc.getTextWidth(ligne2);
      doc.text(mandataireNom, leftMargin + ligne2Width, yPos);

      // Suite de la deuxième ligne
      doc.setFont('helvetica', 'normal');
      const ligne2Suite = ', (fonction) pour le représenter dans la circonscription électorale de ';
      doc.text(ligne2Suite, leftMargin + ligne2Width + doc.getTextWidth(mandataireNom + ' '), yPos);

      yPos += lineHeight;

      // Troisième ligne avec la circonscription
      doc.setFont('helvetica', 'bold');
      const circonscriptionText = `${mandate.formData.circonscription.toUpperCase()}`;
      doc.text(circonscriptionText, leftMargin, yPos);

      // Suite de la troisième ligne
      doc.setFont('helvetica', 'normal');
      doc.text('.', leftMargin + doc.getTextWidth(circonscriptionText), yPos);

      yPos += lineHeight * 2;

      // Quatrième ligne - deuxième paragraphe
      const ligne4 = 'Le présent mandat est délivré à l\'intéressé(e) en qualité de Représentant(e) Principal(e), afin de';
      doc.text(ligne4, leftMargin, yPos);

      yPos += lineHeight;

      // Cinquième ligne
      const ligne5 = 'défendre et servir les intérêts du candidat ';
      doc.text(ligne5, leftMargin, yPos);

      // "Alassane Ouattara" en gras
      doc.setFont('helvetica', 'bold');
      doc.text(candidateName, leftMargin + doc.getTextWidth(ligne5), yPos);

      // Suite de la cinquième ligne
      doc.setFont('helvetica', 'normal');
      const ligne5Fin = ', et pour valoir ce que de droit.';
      doc.text(ligne5Fin, leftMargin + doc.getTextWidth(ligne5) + doc.getTextWidth(candidateName + ' '), yPos);

      yPos += lineHeight * 5;

      // Date et signature
      const currentDate = new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      // Date à gauche
      doc.text(`Fait .................................................. le ${currentDate}`, leftMargin, yPos);
      
      // Signature à droite
      const signatureX = pageWidth - 50;
      doc.text('Le Candidat', signatureX, yPos - 20, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`Dr ${mandate.formData.prenom} ${mandate.formData.nom}`, signatureX, yPos, { align: 'center' });
      
      // Ajouter le QR code en bas à droite
      const qrCodeWidth = 30;
      const qrCodeHeight = 30;
      const qrCodeX = pageWidth - qrCodeWidth - 20;
      const qrCodeY = pageHeight - qrCodeHeight - 20;
      
      // Convertir le buffer QR code en base64 pour l'ajouter au PDF
      const qrCodeBase64 = qrCodeBuffer.toString('base64');
      doc.addImage(`data:image/png;base64,${qrCodeBase64}`, 'PNG', qrCodeX, qrCodeY, qrCodeWidth, qrCodeHeight);
      
      // Texte sous le QR code
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Scanner pour vérifier', qrCodeX, qrCodeY + qrCodeHeight + 5, { align: 'center' });
      doc.text('l\'authenticité', qrCodeX + qrCodeWidth / 2, qrCodeY + qrCodeHeight + 8, { align: 'center' });

      // Référence en bas à gauche
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Référence: ${mandate.referenceNumber}`, 20, pageHeight - 10);

      // Convertir le PDF en buffer
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      
      this.logger.log(`PDF généré avec succès, taille: ${pdfBuffer.length} bytes`);

      const fileName = `mandat_${mandate.referenceNumber}.pdf`;
      
      return { pdfBuffer, fileName };
    } catch (error) {
      this.logger.error(`Erreur lors de la génération du PDF pour le mandat ${mandate.id}:`, error);
      throw error;
    }
  }

  /**
   * Génère un PDF de manière asynchrone avec cache
   */
  async generateMandatePDFAsync(mandate: Mandate): Promise<{ jobId: string }> {
    try {
      // Vérifier d'abord le cache
      const cachedPDF = await this.cacheService.getCachedPDF(mandate.referenceNumber);
      if (cachedPDF) {
        this.logger.log(`PDF trouvé en cache pour: ${mandate.referenceNumber}`);
        const jobId = uuidv4();
        await this.cacheService.setPDFGenerationStatus(jobId, 'completed', {
          pdfBuffer: cachedPDF,
          fileName: `mandat_${mandate.referenceNumber}.pdf`
        });
        return { jobId };
      }

      // Créer un job de génération
      const jobId = uuidv4();
      await this.cacheService.setPDFGenerationStatus(jobId, 'pending');

      // Lancer la génération en arrière-plan
      this.processPDFGeneration(jobId, mandate);

      return { jobId };
    } catch (error) {
      this.logger.error(`Erreur lors du démarrage de la génération asynchrone pour ${mandate.id}:`, error);
      throw error;
    }
  }

  /**
   * Traitement asynchrone de la génération PDF
   */
  private async processPDFGeneration(jobId: string, mandate: Mandate): Promise<void> {
    try {
      await this.cacheService.setPDFGenerationStatus(jobId, 'processing');

      // Générer le PDF
      const { pdfBuffer, fileName } = await this.generateMandatePDF(mandate);

      // Mettre en cache
      await this.cacheService.cachePDF(mandate.referenceNumber, pdfBuffer);

      // Mettre à jour le statut
      await this.cacheService.setPDFGenerationStatus(jobId, 'completed', {
        pdfBuffer,
        fileName
      });

      this.logger.log(`Génération PDF asynchrone terminée pour job: ${jobId}`);
    } catch (error) {
      this.logger.error(`Erreur lors de la génération asynchrone pour job ${jobId}:`, error);
      await this.cacheService.setPDFGenerationStatus(jobId, 'failed', {
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  /**
   * Récupère le statut d'une génération PDF
   */
  async getPDFGenerationStatus(jobId: string): Promise<{ status: string; data?: any; timestamp: string } | null> {
    return this.cacheService.getPDFGenerationStatus(jobId);
  }

  /**
   * Récupère un PDF depuis le cache
   */
  async getCachedPDF(referenceNumber: string): Promise<{ pdfBuffer: Buffer; fileName: string } | null> {
    try {
      const pdfBuffer = await this.cacheService.getCachedPDF(referenceNumber);
      if (pdfBuffer) {
        return {
          pdfBuffer,
          fileName: `mandat_${referenceNumber}.pdf`
        };
      }
      return null;
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération du PDF en cache pour ${referenceNumber}:`, error);
      return null;
    }
  }

  /**
   * Supprime un PDF du cache
   */
  async deleteCachedPDF(referenceNumber: string): Promise<void> {
    try {
      await this.cacheService.deleteCachedPDF(referenceNumber);
      this.logger.log(`PDF supprimé du cache pour: ${referenceNumber}`);
    } catch (error) {
      this.logger.error(`Erreur lors de la suppression du PDF en cache pour ${referenceNumber}:`, error);
      throw error;
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { jsPDF } from 'jspdf';
import { Mandate } from '../../entities/mandate.entity';
import { SecurityService } from '../security/security.service';
import { CacheService } from '../cache/cache.service';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

interface MandateData {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  circonscription: string;
  referenceNumber: string;
  status: string;
  createdAt: string;
  fonction?: string; // Fonction du demandeur
}

// Fonctions de sécurité et de validation - IDENTIQUE au composant React
const SecurityUtils = {
  validateMandateData(mandate: MandateData): MandateData {
    if (!mandate || typeof mandate !== 'object') {
      throw new Error('Données du mandat invalides');
    }

    const requiredFields = ['id', 'nom', 'prenom', 'email', 'telephone', 'circonscription', 'referenceNumber'];
    for (const field of requiredFields) {
      if (!mandate[field as keyof MandateData]) {
        throw new Error(`Champ obligatoire manquant: ${field}`);
      }
    }

    return {
      ...mandate,
      nom: this.sanitizeText(mandate.nom),
      prenom: this.sanitizeText(mandate.prenom),
      email: this.sanitizeText(mandate.email),
      telephone: this.sanitizeText(mandate.telephone),
      circonscription: this.sanitizeText(mandate.circonscription),
      referenceNumber: this.validateReferenceNumber(mandate.referenceNumber)
    };
  },

  sanitizeText(text: string): string {
    if (typeof text !== 'string') {
      return '';
    }

    return text
      .trim()
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .substring(0, 100);
  },

  validateReferenceNumber(referenceNumber: string): string {
    if (typeof referenceNumber !== 'string') {
      throw new Error('Numéro de référence invalide');
    }

    const refPattern = /^MND-[A-Z0-9]{8}-[A-Z0-9]{4}$/;
    if (!refPattern.test(referenceNumber)) {
      throw new Error('Format du numéro de référence invalide');
    }

    return referenceNumber;
  },

  encodeURIComponentSafe(value: string): string {
    return encodeURIComponent(value)
      .replace(/'/g, '%27')
      .replace(/"/g, '%22');
  },

  generateSecureFileName(referenceNumber: string): string {
    const sanitized = referenceNumber.replace(/[^a-zA-Z0-9-_]/g, '_');
    return `mandat_${sanitized}.pdf`;
  },

  async generateSignature(mandate: MandateData): Promise<string> {
    const secretKey = process.env.PDF_SIGNATURE_SECRET;
    
    if (!secretKey) {
      throw new Error('Clé secrète pour la signature PDF non configurée');
    }
    
    const dataToSign = `${mandate.id}-${mandate.referenceNumber}-${new Date(mandate.createdAt).getTime()}`;
    
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(dataToSign);
    const signature = hmac.digest('hex');
    return signature.substring(0, 16);
  },

  async generateVerificationUrl(mandate: MandateData, baseUrl?: string): Promise<string> {
    const signature = await this.generateSignature(mandate);
    const verificationBaseUrl = baseUrl || process.env.VERIFICATION_BASE_URL || 'http://localhost:3000';
    return `${verificationBaseUrl}/verification?ref=${mandate.referenceNumber}&sig=${signature}`;
  },

};

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  constructor(
    private securityService: SecurityService,
    private cacheService: CacheService,
  ) {}

  /**
   * Charge le logo en base64 depuis le dossier public
   */
  private loadLogo(): string {
    try {
      // Essayer plusieurs chemins possibles
      const possiblePaths = [
        path.join(process.cwd(), 'public', 'logorhdp.png'),
        path.join(__dirname, '..', '..', '..', '..', 'public', 'logorhdp.png'),
        path.join(__dirname, '..', '..', 'assets', 'logorhdp.png')
      ];
      
      let logoPath = '';
      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
          logoPath = possiblePath;
          break;
        }
      }
      
      if (!logoPath) {
        this.logger.error('Aucun fichier logo trouvé dans les chemins suivants:');
        possiblePaths.forEach(p => this.logger.error(`  - ${p}`));
        return '';
      }
      
      this.logger.log(`Logo trouvé à: ${logoPath}`);
      
      const logoBuffer = fs.readFileSync(logoPath);
      const base64String = logoBuffer.toString('base64');
      const dataUrl = `data:image/png;base64,${base64String}`;
      
      return dataUrl;
    } catch (error) {
      this.logger.error('Erreur lors du chargement du logo:', error);
      return '';
    }
  }

  /**
   * Charge la signature en base64 depuis le dossier public
   */
  private loadSignature(): string {
    try {
      // Essayer plusieurs chemins possibles
      const possiblePaths = [
        path.join(process.cwd(), 'public', 'signature.png'),
        path.join(__dirname, '..', '..', '..', '..', 'public', 'signature.png'),
        path.join(__dirname, '..', '..', 'assets', 'signature.png')
      ];
      
      let signaturePath = '';
      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
          signaturePath = possiblePath;
          break;
        }
      }
      
      if (!signaturePath) {
        this.logger.error('Aucun fichier signature trouvé dans les chemins suivants:');
        possiblePaths.forEach(p => this.logger.error(`  - ${p}`));
        return '';
      }
      
      this.logger.log(`Signature trouvée à: ${signaturePath}`);
      
      const signatureBuffer = fs.readFileSync(signaturePath);
      const base64String = signatureBuffer.toString('base64');
      const dataUrl = `data:image/png;base64,${base64String}`;
      
      return dataUrl;
    } catch (error) {
      this.logger.error('Erreur lors du chargement de la signature:', error);
      return '';
    }
  }

  /**
   * Génère un PDF de mandat - LOGIQUE IDENTIQUE au composant React
   */
  async generateMandatePDF(mandate: Mandate): Promise<{ pdfBuffer: Buffer; fileName: string }> {
    try {
      this.logger.log(`Génération du PDF pour le mandat: ${mandate.id}`);

      // Valider et sécuriser les données du mandat - MÊME LOGIQUE QUE REACT
      let secureMandate: MandateData;
      try {
        secureMandate = SecurityUtils.validateMandateData({
          id: mandate.id,
          nom: mandate.formData.nom,
          prenom: mandate.formData.prenom,
          email: mandate.formData.email,
          telephone: mandate.formData.telephone,
          circonscription: mandate.formData.circonscription,
          referenceNumber: mandate.referenceNumber,
          status: mandate.status,
          createdAt: mandate.createdAt.toISOString(),
          fonction: mandate.formData.fonction
        });
      } catch (error) {
        this.logger.error('Erreur de validation des données:', error);
        throw new Error('Données du mandat invalides ou manquantes');
      }

      const doc = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const primaryColor: [number, number, number] = [0, 0, 0];
      
      let yPos = 10;

      // En-tête avec logos - MÊME LOGIQUE QUE REACT
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      
      // Logo RHDP à gauche - taille augmentée et centré verticalement
      const logoWidth = 170;
      const logoHeight = 30;
      const logoX = 20;
      const logoY = yPos + 10; // Position légèrement remontée pour mieux centrer
      const logoDataUrl = this.loadLogo();
      if (logoDataUrl) {
        doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoWidth, logoHeight);
      }
      
      yPos += 60; // Espacement augmenté après le très grand logo

      // Titre principal sur la même ligne en gras noir
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      
      doc.text('ÉLECTION DU PRÉSIDENT DE LA RÉPUBLIQUE DU 25 OCTOBRE 2025', pageWidth / 2, yPos + 10, { align: 'center' });
      
      yPos += 30;

      // Sous-titre avec carte de fond orange
      doc.setFillColor(255, 130, 0); // Orange #FF8200
      doc.setDrawColor(0, 0, 0); // Noir pour la bordure
      doc.setLineWidth(0.5); // Épaisseur très fine
      const cardWidth = 90;
      const cardHeight = 10;
      const cardX = (pageWidth - cardWidth) / 2;
      const cardY = yPos - 5;
      doc.rect(cardX, cardY, cardWidth, cardHeight, 'FD'); // FD = Fill and Draw
      
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0); // Noir pour le texte
      const fonction = secureMandate.fonction || 'fonction'; // Récupérer la fonction ou utiliser "fonction" par défaut
      doc.text(`MANDAT ANIMATEUR DE CAMPAGNE`, pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 25;

      // Corps du document - MARGES FIXES (aligné avec le titre à 30mm)
      const leftMargin = 30; // Aligné avec le titre "ÉLECTION PRESIDENTIELLE"
      const fixedTextWidth = 140; // Largeur ajustée pour l'alignement
      const rightMargin = leftMargin + fixedTextWidth;
      const lineHeight = 6; // Espacement augmenté entre les lignes

      doc.setFontSize(10.5); // Taille augmentée pour le contenu
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...primaryColor);

      // Fonction pour dessiner du texte avec largeur fixe, gestion des débordements et couleur - MÊME LOGIQUE QUE REACT
      const drawFixedWidthTextWithBold = (textParts: {text: string, bold: boolean, color?: [number, number, number]}[], y: number) => {
        let currentY = y;

        // Construire le texte complet
        let fullText = '';
        for (const part of textParts) {
          fullText += part.text;
        }

        // Diviser le texte en lignes de largeur fixe (méthode simplifiée)
        const words = fullText.split(' ');
        let currentLine = '';
        const lines = [];

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const testWidth = doc.getTextWidth(testLine);
          
          if (testWidth <= fixedTextWidth) {
            currentLine = testLine;
          } else {
            // Si la ligne actuelle + le mot dépasse, on garde la ligne actuelle
            // et on commence une nouvelle ligne avec le mot
            if (currentLine) {
              lines.push(currentLine);
            }
            currentLine = word;
          }
        }
        
        if (currentLine) {
          lines.push(currentLine);
        }

        // Dessiner chaque ligne (méthode simplifiée sans reconstruction complexe)
        for (const line of lines) {
          let currentX = leftMargin;
          
          // Pour chaque ligne, appliquer le formatage aux parties correspondantes
          let remainingLine = line;
          
          for (const part of textParts) {
            if (!remainingLine) break;
            
            // Vérifier si cette partie est présente dans la ligne
            if (remainingLine.startsWith(part.text)) {
              // La partie entière est présente
              if (part.bold) {
                doc.setFont('helvetica', 'bold');
              } else {
                doc.setFont('helvetica', 'normal');
              }
              // Appliquer la couleur si spécifiée
              if (part.color) {
                doc.setTextColor(...part.color);
              } else {
                doc.setTextColor(...primaryColor);
              }
              doc.text(part.text, currentX, currentY);
              currentX += doc.getTextWidth(part.text);
              remainingLine = remainingLine.substring(part.text.length);
              // Remettre la couleur par défaut
              doc.setTextColor(...primaryColor);
            } else if (part.text.startsWith(remainingLine)) {
              // Seule une partie du texte original est présente
              if (part.bold) {
                doc.setFont('helvetica', 'bold');
              } else {
                doc.setFont('helvetica', 'normal');
              }
              // Appliquer la couleur si spécifiée
              if (part.color) {
                doc.setTextColor(...part.color);
              } else {
                doc.setTextColor(...primaryColor);
              }
              doc.text(remainingLine, currentX, currentY);
              currentX += doc.getTextWidth(remainingLine);
              remainingLine = '';
              // Remettre la couleur par défaut
              doc.setTextColor(...primaryColor);
            }
          }
          
          // Si il reste du texte non formaté, le dessiner en normal
          if (remainingLine) {
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...primaryColor);
            doc.text(remainingLine, currentX, currentY);
          }
          
          currentY += lineHeight;
        }

        // Remettre la police normale
        doc.setFont('helvetica', 'normal');
        
        // Retourner la position Y finale pour la prochaine ligne
        return currentY - lineHeight; // Ajuster pour la dernière ligne
      };

     // Première ligne
     const ligne1Parts = [
       { text: 'Monsieur ', bold: false },
       { text: 'KALIL KONATE', bold: true },
       { text: ', Directeur régional de la Campagne Associé de S.E.M.', bold: false }
     ];
     yPos = drawFixedWidthTextWithBold(ligne1Parts, yPos);
     yPos += lineHeight;

     // Deuxième ligne
     const ligne2Parts = [
       { text: 'ALASSANE OUATTARA', bold: true },
       { text: ', candidat du Rassemblement des Houphouétistes pour la', bold: false }
     ];
     yPos = drawFixedWidthTextWithBold(ligne2Parts, yPos);
     yPos += lineHeight;

     // Troisième ligne - Taille 11
     doc.setFontSize(10);
     const ligne3Parts = [
       { text: 'Démocratie et la Paix (RHDP) à l\'Élection du Président de la République du 25 Octobre', bold: false }
     ];
     yPos = drawFixedWidthTextWithBold(ligne3Parts, yPos);
     yPos += lineHeight;
     doc.setFontSize(10.5); // Remettre à 12 pour les lignes suivantes

     // Quatrième ligne
     const ligne4Parts = [
       { text: '2025', bold: true },
       { text: ', donne mandat à:', bold: false }
     ];
     yPos = drawFixedWidthTextWithBold(ligne4Parts, yPos);
     yPos += lineHeight;

     // Cinquième ligne - Nom du demandeur (en bleu comme stylo à bille)
     const ligne5Parts = [
       { text: 'M/Mme ', bold: false },
       { text: `${secureMandate.prenom.toUpperCase()} ${secureMandate.nom.toUpperCase()}`, bold: true, color: [0, 0, 255] as [number, number, number] } // Bleu
     ];
     yPos = drawFixedWidthTextWithBold(ligne5Parts, yPos);
     yPos += lineHeight;

     // Sixième ligne
     const ligne6Parts = [
       { text: 'en qualité d\'animateur de sa campagne dans la circonscription électorale de la Région', bold: false }
     ];
     yPos = drawFixedWidthTextWithBold(ligne6Parts, yPos);
     yPos += lineHeight;

     // Septième ligne
     const ligne7Parts = [
       { text: 'du Hambol à la période du ', bold: false },
       { text: '..........', bold: true },
       { text: ' au ', bold: false },
       { text: '..........', bold: true }
     ];
     yPos = drawFixedWidthTextWithBold(ligne7Parts, yPos);
     yPos += lineHeight * 1.5; // Espacement augmenté entre ligne 7 et 8

     // Huitième ligne
     const ligne8Parts = [
       { text: 'En foi de quoi, le présent mandat lui est délivré pour servir les intérêts du Candidat', bold: false }
     ];
     yPos = drawFixedWidthTextWithBold(ligne8Parts, yPos);
     yPos += lineHeight;

     // Neuvième ligne
     const ligne9Parts = [
       { text: 'Alassane OUATTARA et valoir ce que de droit.', bold: false }
     ];
     yPos = drawFixedWidthTextWithBold(ligne9Parts, yPos);

     yPos += lineHeight * 3;

     // Date et signature - alignées à droite
     doc.setFont('helvetica', 'bold');
     doc.setFontSize(10);
     const dateText = 'Fait à Abidjan, le 10 octobre 2025';
     doc.text(dateText, pageWidth - 20, yPos, { align: 'right' });
     yPos += lineHeight * 2;

     // Direction Régionale (souligné fin)
     doc.setFont('helvetica', 'normal');
     doc.setFontSize(10);
     const directionText = 'la Direction Régionale';
     doc.text(directionText, pageWidth - 20, yPos, { align: 'right' });
     // Ajouter le soulignement fin
     const directionWidth = doc.getTextWidth(directionText);
     const directionX = pageWidth - 20 - directionWidth;
     doc.setLineWidth(0.1); // Épaisseur très fine
     doc.line(directionX, yPos + 1, directionX + directionWidth, yPos + 1);
     
     yPos += lineHeight;
     
     const campagneText = 'de campagne Associé (DRCA)';
     doc.text(campagneText, pageWidth - 20, yPos, { align: 'right' });
     // Ajouter le soulignement fin
     const campagneWidth = doc.getTextWidth(campagneText);
     const campagneX = pageWidth - 20 - campagneWidth;
     doc.setLineWidth(0.1); // Épaisseur très fine
     doc.line(campagneX, yPos + 1, campagneX + campagneWidth, yPos + 1);
     doc.setLineWidth(1); // Remettre l'épaisseur par défaut
     
     // Signature en bas à droite
     const signatureDataUrl = this.loadSignature();
     if (signatureDataUrl) {
       const signatureWidth = 170;
       const signatureHeight = 90;
       const signatureX = pageWidth - signatureWidth + 30;
       const signatureY = pageHeight - signatureHeight - 10;
       doc.addImage(signatureDataUrl, 'PNG', signatureX, signatureY, signatureWidth, signatureHeight);
     }

     // Convertir le PDF en buffer
     const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
     
     this.logger.log(`PDF généré avec succès, taille: ${pdfBuffer.length} bytes`);

     const fileName = SecurityUtils.generateSecureFileName(secureMandate.referenceNumber);
     
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
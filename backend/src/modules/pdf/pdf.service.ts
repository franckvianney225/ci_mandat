import { Injectable, Logger } from '@nestjs/common';
import { jsPDF } from 'jspdf';
import { Mandate } from '../../entities/mandate.entity';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  /**
   * Génère un PDF de mandat avec exactement le même design que le frontend
   */
  async generateMandatePDF(mandate: Mandate): Promise<{ pdfBuffer: Buffer; fileName: string }> {
    try {
      this.logger.log(`Génération du PDF pour le mandat: ${mandate.id}`);

      const doc = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
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
      
      // Texte CEI à gauche
      doc.text('COMMISSION ELECTORALE', 20, yPos);
      doc.text('INDÉPENDANTE', 20, yPos + 5);
      
      // Cercle jaune CEI
      doc.setFillColor(...yellowColor);
      doc.circle(35, yPos + 15, 8, 'F');
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text('CEI', 32, yPos + 17);
      
      // Texte sous le cercle
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('CURESS', 20, yPos + 28);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('L\'Espérance au Service du Peuple', 20, yPos + 32);
      
      // République à droite
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('RÉPUBLIQUE DE CÔTE D\'IVOIRE', pageWidth - 20, yPos, { align: 'right' });
      doc.setFontSize(9);
      doc.text('Union-Discipline-Travail', pageWidth - 20, yPos + 5, { align: 'right' });
      
      yPos += 45;

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

      // Paragraphe 1
      doc.text('Conformément aux dispositions des articles 35 nouveau et 38 du code électoral :', leftMargin, yPos, { maxWidth: textWidth });
      yPos += lineHeight * 2;

      // Paragraphe 2
      doc.setFont('helvetica', 'bold');
      doc.text('ALLASSANE OUATTARA', leftMargin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(' candidat à l\'élection présidentielle du 25 octobre 2025,', leftMargin + doc.getTextWidth('ALLASSANE OUATTARA '), yPos);
      yPos += lineHeight * 2;

      // Paragraphe 3
      doc.text('donne mandat à Mme/M................................................................................', leftMargin, yPos);
      yPos += lineHeight * 2;

      // Paragraphe 4
      doc.text('pour le représenter dans le Bureau de vote n°................................................................', leftMargin, yPos);
      yPos += lineHeight * 2;

      // Paragraphe 5
      doc.text('du Lieu de Vote........................................................................................................................', leftMargin, yPos);
      yPos += lineHeight * 2;

      // Paragraphe 6
      doc.text('de la circonscription électorale d\'', leftMargin, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(mandate.formData.circonscription, leftMargin + doc.getTextWidth('de la circonscription électorale d\''), yPos);
      doc.setFont('helvetica', 'normal');
      doc.text('.', leftMargin + doc.getTextWidth('de la circonscription électorale d\'' + mandate.formData.circonscription), yPos);
      yPos += lineHeight * 2;

      // Paragraphe 7
      doc.text('Le présent mandat lui est délivré en qualité de Représentant(e) Principal(e) pour servir', leftMargin, yPos);
      yPos += lineHeight;
      doc.text('les intérêts du Candidat ', leftMargin, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(`${mandate.formData.prenom} ${mandate.formData.nom}`, leftMargin + doc.getTextWidth('les intérêts du Candidat '), yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(' et en valoir ce que de droit.', leftMargin + doc.getTextWidth('les intérêts du Candidat ' + mandate.formData.prenom + ' ' + mandate.formData.nom), yPos);
      
      yPos += lineHeight * 3;

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
      
      // Référence en bas
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Référence: ${mandate.referenceNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

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
}
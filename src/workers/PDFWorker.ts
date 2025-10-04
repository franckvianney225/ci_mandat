// Web Worker pour la génération PDF non bloquante
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

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
}

interface WorkerMessage {
  type: 'generate' | 'status' | 'error' | 'complete';
  data?: any;
  progress?: number;
}

// Fonctions de sécurité et de validation (identique au composant principal)
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

  generateSecureFileName(referenceNumber: string): string {
    const sanitized = referenceNumber.replace(/[^a-zA-Z0-9-_]/g, '_');
    return `mandat_${sanitized}.pdf`;
  },

  addSecurityWatermark(doc: jsPDF, pageWidth: number, pageHeight: number): void {
    doc.saveGraphicsState();

    // Configuration du filigrane
    doc.setTextColor(245, 245, 245);
    doc.setFontSize(36);
    doc.setFont('helvetica', 'bold');

    const watermarkText = 'OFFICIEL';
    const angle = -45;
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

    doc.restoreGraphicsState();
  }
};

// Fonction principale de génération PDF
async function generatePDF(mandate: MandateData): Promise<{ pdfBlob: Blob; fileName: string }> {
  // Étape 1 : Validation et sécurisation des données
  const secureMandate = SecurityUtils.validateMandateData(mandate);

  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Ajouter le filigrane de sécurité
  SecurityUtils.addSecurityWatermark(doc, pageWidth, pageHeight);

  // Générer le QR code
  const generateQRCode = async (): Promise<string> => {
    try {
      // Pour le worker, on génère une URL de vérification simple
      const verificationUrl = `${self.location.origin}/verification?ref=${secureMandate.referenceNumber}`;
      
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 150,
        margin: 1,
        color: {
          dark: '#FF8200',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });

      return qrCodeDataUrl;
    } catch (error) {
      console.error('Erreur lors de la génération du QR code:', error);
      throw error;
    }
  };

  const qrCodeDataUrl = await generateQRCode();
  
  // Couleurs
  const primaryColor: [number, number, number] = [0, 0, 0];
  const secondaryColor: [number, number, number] = [52, 73, 94];
  const yellowColor: [number, number, number] = [255, 215, 0];
  
  // Position Y courante
  let yPos = 20;

  // En-tête avec logos
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
  doc.setTextColor(30, 64, 175);
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
  doc.text(secureMandate.circonscription, leftMargin + doc.getTextWidth('de la circonscription électorale d\''), yPos);
  doc.setFont('helvetica', 'normal');
  doc.text('.', leftMargin + doc.getTextWidth('de la circonscription électorale d\'' + secureMandate.circonscription), yPos);
  yPos += lineHeight * 2;

  // Paragraphe 7
  doc.text('Le présent mandat lui est délivré en qualité de Représentant(e) Principal(e) pour servir', leftMargin, yPos);
  yPos += lineHeight;
  doc.text('les intérêts du Candidat ', leftMargin, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(`${secureMandate.prenom} ${secureMandate.nom}`, leftMargin + doc.getTextWidth('les intérêts du Candidat '), yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(' et en valoir ce que de droit.', leftMargin + doc.getTextWidth('les intérêts du Candidat ' + secureMandate.prenom + ' ' + secureMandate.nom), yPos);
  
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
  doc.text(`Dr ${secureMandate.prenom} ${secureMandate.nom}`, signatureX, yPos, { align: 'center' });
  
  // Ajouter le QR code en bas à droite
  if (qrCodeDataUrl) {
    const qrCodeWidth = 30;
    const qrCodeHeight = 30;
    const qrCodeX = pageWidth - qrCodeWidth - 20;
    const qrCodeY = pageHeight - qrCodeHeight - 20;
    
    doc.addImage(qrCodeDataUrl, 'PNG', qrCodeX, qrCodeY, qrCodeWidth, qrCodeHeight);
    
    // Texte sous le QR code
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Scanner pour vérifier', qrCodeX, qrCodeY + qrCodeHeight + 5, { align: 'center' });
    doc.text('l\'authenticité', qrCodeX + qrCodeWidth / 2, qrCodeY + qrCodeHeight + 8, { align: 'center' });
  }

  // Référence en bas à gauche
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Référence: ${secureMandate.referenceNumber}`, 20, pageHeight - 10);

  // Convertir en Blob
  const pdfBlob = doc.output('blob');
  const fileName = SecurityUtils.generateSecureFileName(secureMandate.referenceNumber);

  return { pdfBlob, fileName };
}

// Gestion des messages du worker
self.addEventListener('message', async (event: MessageEvent<{ type: 'generate'; mandate: MandateData }>) => {
  try {
    if (event.data.type === 'generate') {
      const { mandate } = event.data;

      // Envoyer un statut de progression
      self.postMessage({ type: 'status', progress: 10 });

      // Générer le PDF
      const { pdfBlob, fileName } = await generatePDF(mandate);

      // Envoyer le résultat
      self.postMessage({ 
        type: 'complete', 
        data: { 
          pdfBlob,
          fileName
        } 
      });
    }
  } catch (error) {
    console.error('Erreur dans le worker PDF:', error);
    self.postMessage({ 
      type: 'error', 
      data: error instanceof Error ? error.message : 'Erreur inconnue lors de la génération PDF'
    });
  }
});

// Type pour TypeScript
declare const self: WorkerGlobalScope & typeof globalThis;
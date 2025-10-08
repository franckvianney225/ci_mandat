'use client';
import { jsPDF } from 'jspdf';
import { useEffect, forwardRef, useImperativeHandle } from 'react';
import { createRoot } from 'react-dom/client';
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

// Fonctions de sécurité et de validation
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
    const secretKey = process.env.NEXT_PUBLIC_PDF_SIGNATURE_SECRET;
    
    if (!secretKey) {
      throw new Error('Clé secrète pour la signature PDF non configurée');
    }
    
    const dataToSign = `${mandate.id}-${mandate.referenceNumber}-${new Date(mandate.createdAt).getTime()}`;
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKey);
    const data = encoder.encode(dataToSign);
    
    return crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    ).then(key => {
      return crypto.subtle.sign('HMAC', key, data);
    }).then(signature => {
      const hashArray = Array.from(new Uint8Array(signature));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex.substring(0, 16);
    });
  },

  async generateVerificationUrl(mandate: MandateData, baseUrl?: string): Promise<string> {
    const signature = await this.generateSignature(mandate);
    const verificationBaseUrl = baseUrl || process.env.NEXT_PUBLIC_VERIFICATION_BASE_URL || 'http://localhost:3000';
    return `${verificationBaseUrl}/verification?ref=${mandate.referenceNumber}&sig=${signature}`;
  },

  addSecurityWatermark(doc: jsPDF, pageWidth: number, pageHeight: number): void {
    doc.saveGraphicsState();
    doc.setTextColor(245, 245, 245);
    doc.setFontSize(36);
    doc.setFont('helvetica', 'bold');

    const watermarkText = 'OFFICIEL';
    const angle = -45;
    const stepX = 60;
    const stepY = 45;

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

interface PDFMandatGeneratorProps {
  mandate: MandateData;
  onClose: () => void;
}

const PDFMandatGenerator = forwardRef(({
  mandate,
  onClose
}: PDFMandatGeneratorProps, ref) => {
  const generatePDF = async () => {
    let secureMandate: MandateData;
    try {
      secureMandate = SecurityUtils.validateMandateData(mandate);
    } catch (error) {
      console.error('Erreur de validation des données:', error);
      throw new Error('Données du mandat invalides ou manquantes');
    }

    const doc = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Ajouter le filigrane
    SecurityUtils.addSecurityWatermark(doc, pageWidth, pageHeight);

    // Générer le QR code
    const generateQRCode = async (): Promise<string> => {
      try {
        const baseUrl = window.location.origin;
        const verificationUrl = await SecurityUtils.generateVerificationUrl(secureMandate, baseUrl);

        try {
          new URL(verificationUrl);
        } catch {
          throw new Error('URL de vérification invalide générée');
        }

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
    
    const primaryColor: [number, number, number] = [0, 0, 0];
    
    let yPos = 10;

    // En-tête avec logos
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    
    // Logo RHDP à gauche
    const logoWidth = 25;
    const logoHeight = 25;
    const logoX = 20;
    const logoY = yPos;
    const logoPath = '/logorhdp.jpeg';
    
    // Fonction pour charger le logo avec fallback en base64
    const loadLogo = () => {
      try {
        // Essayer d'ajouter le logo normal
        doc.addImage(logoPath, 'JPEG', logoX, logoY, logoWidth, logoHeight);
      } catch (error) {
        console.warn('Logo normal non trouvé, utilisation du logo base64');
        // Si le logo normal ne peut pas être chargé, utiliser le logo en base64
        // ICI: Insérer le code base64 du logo
        const logoBase64 = ''
                if (logoBase64) {
          doc.addImage(logoBase64, 'JPEG', logoX, logoY, logoWidth, logoHeight);
        }
      }
    };
    
    loadLogo();

    // République à droite
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);

    // Texte principal aligné à droite
    const republiqueText = 'RÉPUBLIQUE DE CÔTE D\'IVOIRE';
    doc.text(republiqueText, pageWidth - 20, yPos + 5, { align: 'right' });

    // Calculer la largeur du texte pour centrer le texte en dessous
    const republiqueTextWidth = doc.getTextWidth(republiqueText);
    const republiqueStartX = pageWidth - 20 - republiqueTextWidth;

    // Texte en dessous centré
    doc.setFontSize(9);
    const unionText = 'Union-Discipline-Travail';
    const unionTextWidth = doc.getTextWidth(unionText);
    const unionStartX = republiqueStartX + (republiqueTextWidth - unionTextWidth) / 2;
    doc.text(unionText, unionStartX, yPos + 11);

    yPos += 60;

    // Titre principal avec bordure
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(2);
    doc.rect(30, yPos, pageWidth - 60, 25);
    
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
    yPos += 7;
    doc.text('DANS LE BUREAU DE VOTE', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 20;

    // Corps du document - MARGES CENTRÉES
    const leftMargin = 30;
    const rightMargin = pageWidth - 30;
    const textWidth = rightMargin - leftMargin;
    const lineHeight = 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...primaryColor);

    // Corps du document - TEXTE CENTRÉ AVEC FORMATAGE
    const centerX = pageWidth / 2;
    
    // Fonction pour centrer du texte avec des parties en gras
    const drawCenteredTextWithBold = (textParts: {text: string, bold: boolean}[], y: number) => {
      // Calculer la largeur totale
      let totalWidth = 0;
      for (const part of textParts) {
        if (part.bold) {
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setFont('helvetica', 'normal');
        }
        totalWidth += doc.getTextWidth(part.text);
      }

      // Position de départ pour centrer sur toute la largeur de la page
      const startX = (pageWidth - totalWidth) / 2;
      let currentX = startX;

      // Dessiner chaque partie
      for (const part of textParts) {
        if (part.bold) {
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setFont('helvetica', 'normal');
        }
        doc.text(part.text, currentX, y);
        currentX += doc.getTextWidth(part.text);
      }

      // Remettre la police normale
      doc.setFont('helvetica', 'normal');
    };

    // Première ligne
    const ligne1Parts = [
      { text: 'Conformément aux dispositions des articles 35 nouveau et 38 du Code électoral, Monsieur ', bold: false },
      { text: 'ALASSANE OUATTARA', bold: true },
      { text: ', candidat à l\'élection présidentielle du 25 octobre 2025,', bold: false }
    ];
    drawCenteredTextWithBold(ligne1Parts, yPos);
    yPos += lineHeight;

    // Deuxième ligne
    const ligne2Parts = [
      { text: 'donne mandat à Mme/M. ', bold: false },
      { text: `${secureMandate.prenom.toUpperCase()} ${secureMandate.nom.toUpperCase()}`, bold: true },
      { text: ', (fonction) pour le représenter dans la circonscription électorale de ', bold: false }
    ];
    drawCenteredTextWithBold(ligne2Parts, yPos);
    yPos += lineHeight;

    // Troisième ligne
    const ligne3Parts = [
      { text: `${secureMandate.circonscription.toUpperCase()}`, bold: true },
      { text: '.', bold: false }
    ];
    drawCenteredTextWithBold(ligne3Parts, yPos);
    yPos += lineHeight * 2;

    // Quatrième ligne
    const ligne4Parts = [
      { text: 'Le présent mandat est délivré à l\'intéressé(e) en qualité de Représentant(e) Principal(e), afin de', bold: false }
    ];
    drawCenteredTextWithBold(ligne4Parts, yPos);
    yPos += lineHeight;

    // Cinquième ligne
    const ligne5Parts = [
      { text: 'défendre et servir les intérêts du candidat ', bold: false },
      { text: 'ALASSANE OUATTARA', bold: true },
      { text: ', et pour valoir ce que de droit.', bold: false }
    ];
    drawCenteredTextWithBold(ligne5Parts, yPos);

    yPos += lineHeight * 3;

    // Date et signature
    const currentDate = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Date alignée à droite
    const dateText = `Fait à (lieu) le ${currentDate}`;
    doc.text(dateText, pageWidth - 20, yPos, { align: 'right' });
    
    // Signature à droite - positionnée en dessous de la date
    // const signatureX = pageWidth - 60;
    // doc.setFont('helvetica', 'normal');
    // doc.setFontSize(10);
    // doc.text('Le Candidat', signatureX, yPos + 10, { align: 'center' });
    // doc.setFont('helvetica', 'bold');
    // doc.setFontSize(11);
    // doc.text(`${secureMandate.prenom} ${secureMandate.nom}`, signatureX, yPos + 25, { align: 'center' });
    
    // QR code en bas à droite
    if (qrCodeDataUrl) {
      const qrCodeWidth = 30;
      const qrCodeHeight = 30;
      const qrCodeX = pageWidth - qrCodeWidth - 20;
      const qrCodeY = pageHeight - qrCodeHeight - 20;
      
      doc.addImage(qrCodeDataUrl, 'PNG', qrCodeX, qrCodeY, qrCodeWidth, qrCodeHeight);
      
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Scanner pour vérifier', qrCodeX + qrCodeWidth / 2, qrCodeY + qrCodeHeight + 4, { align: 'center' });
      doc.text('l\'authenticité', qrCodeX + qrCodeWidth / 2, qrCodeY + qrCodeHeight + 7, { align: 'center' });
    }

    // Référence en bas à gauche
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Référence: ${secureMandate.referenceNumber}`, 20, pageHeight - 10);

    const fileName = SecurityUtils.generateSecureFileName(secureMandate.referenceNumber);
    doc.save(fileName);
    onClose();
  };

  useEffect(() => {
    const generatePDFAsync = async () => {
      try {
        await generatePDF();
      } catch (error) {
        console.error('Erreur génération PDF:', error);
        if (error instanceof Error) {
          alert(`Erreur lors de la génération du PDF: ${error.message}`);
        } else {
          alert('Erreur lors de la génération du PDF');
        }
        onClose();
      }
    };

    generatePDFAsync();
  }, []);

  return null;
});

PDFMandatGenerator.displayName = 'PDFMandatGenerator';

export default PDFMandatGenerator;

export function generateMandatePDF(mandate: MandateData) {
  const pdfContainer = document.createElement('div');
  pdfContainer.style.display = 'none';
  document.body.appendChild(pdfContainer);
  
  const root = createRoot(pdfContainer);
  root.render(
    <PDFMandatGenerator
      mandate={mandate}
      onClose={() => {
        setTimeout(() => {
          root.unmount();
          document.body.removeChild(pdfContainer);
        }, 0);
      }}
    />
  );
}

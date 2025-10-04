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
  /**
   * Valide et nettoie les données du mandat
   */
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

  /**
   * Nettoie le texte pour éviter l'injection XSS et autres attaques
   */
  sanitizeText(text: string): string {
    if (typeof text !== 'string') {
      return '';
    }

    return text
      .trim()
      .replace(/[<>]/g, '') // Supprime les caractères < et >
      .replace(/javascript:/gi, '') // Supprime les références javascript:
      .replace(/on\w+=/gi, '') // Supprime les event handlers
      .substring(0, 100); // Limite la longueur
  },

  /**
   * Valide le format du numéro de référence
   */
  validateReferenceNumber(referenceNumber: string): string {
    if (typeof referenceNumber !== 'string') {
      throw new Error('Numéro de référence invalide');
    }

    // Format attendu: MND-XXXXXXXX-XXXX (MND-8 caractères-4 caractères alphanumériques)
    const refPattern = /^MND-[A-Z0-9]{8}-[A-Z0-9]{4}$/;
    if (!refPattern.test(referenceNumber)) {
      throw new Error('Format du numéro de référence invalide');
    }

    return referenceNumber;
  },

  /**
   * Encode un paramètre URL de manière sécurisée
   */
  encodeURIComponentSafe(value: string): string {
    return encodeURIComponent(value)
      .replace(/'/g, '%27') // Encode les apostrophes
      .replace(/"/g, '%22'); // Encode les guillemets
  },

  /**
   * Génère un nom de fichier sécurisé
   */
  generateSecureFileName(referenceNumber: string): string {
    const sanitized = referenceNumber.replace(/[^a-zA-Z0-9-_]/g, '_');
    return `mandat_${sanitized}.pdf`;
  },

  /**
   * Génère une signature cryptographique identique au backend
   * Utilise la même logique que SecurityService.generateSignature()
   */
  async generateSignature(mandate: MandateData): Promise<string> {
    // IMPORTANT: Cette clé doit être identique à celle du backend
    const secretKey = process.env.NEXT_PUBLIC_PDF_SIGNATURE_SECRET;
    
    if (!secretKey) {
      throw new Error('Clé secrète pour la signature PDF non configurée');
    }
    
    // Même logique que le backend: id + referenceNumber + timestamp
    const dataToSign = `${mandate.id}-${mandate.referenceNumber}-${new Date(mandate.createdAt).getTime()}`;
    
    // Générer le HMAC-SHA256 (identique au backend)
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKey);
    const data = encoder.encode(dataToSign);
    
    // Utiliser Web Crypto API pour générer le HMAC (identique à crypto.createHmac)
    return crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    ).then(key => {
      return crypto.subtle.sign('HMAC', key, data);
    }).then(signature => {
      // Convertir ArrayBuffer en hex string
      const hashArray = Array.from(new Uint8Array(signature));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Même format que le backend: 16 caractères
      return hashHex.substring(0, 16);
    });
  },

  /**
   * Génère une URL de vérification identique au backend
   * Utilise la même logique que SecurityService.generateVerificationUrl()
   */
  async generateVerificationUrl(mandate: MandateData, baseUrl?: string): Promise<string> {
    const signature = await this.generateSignature(mandate);
    const verificationBaseUrl = baseUrl || process.env.NEXT_PUBLIC_VERIFICATION_BASE_URL || 'http://localhost:3000';
    return `${verificationBaseUrl}/verification?ref=${mandate.referenceNumber}&sig=${signature}`;
  },

  /**
   * Ajoute un filigrane de sécurité en arrière-plan (répété sur toute la page)
   */
  addSecurityWatermark(doc: jsPDF, pageWidth: number, pageHeight: number): void {
    doc.saveGraphicsState();

    // Configuration du filigrane
    doc.setTextColor(245, 245, 245); // Gris très clair
    doc.setFontSize(36);
    doc.setFont('helvetica', 'bold');

    // Texte du filigrane (juste OFFICIEL comme demandé)
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
    // Étape 1 : Validation et sécurisation des données
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

    // Ajouter le filigrane de sécurité
    SecurityUtils.addSecurityWatermark(doc, pageWidth, pageHeight);

    // Générer le QR code de manière sécurisée (même logique que le backend)
    const generateQRCode = async (): Promise<string> => {
      try {
        // Générer l'URL de vérification avec signature (identique au backend)
        const baseUrl = window.location.origin;
        const verificationUrl = await SecurityUtils.generateVerificationUrl(secureMandate, baseUrl);

        // Validation supplémentaire de l'URL générée
        try {
          new URL(verificationUrl);
        } catch {
          throw new Error('URL de vérification invalide générée');
        }

        const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
          width: 150,
          margin: 1,
          color: {
            dark: '#FF8200', // Orange CI-Mandat (identique au backend)
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M' // Niveau de correction d'erreur moyen pour plus de sécurité
        });

        return qrCodeDataUrl;
      } catch (error) {
        console.error('Erreur lors de la génération du QR code:', error);
        throw error; // Remonter l'erreur plutôt que de retourner une chaîne vide
      }
    };

    const qrCodeDataUrl = await generateQRCode();
    
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

    // Sauvegarder le PDF avec un nom de fichier sécurisé
    const fileName = SecurityUtils.generateSecureFileName(secureMandate.referenceNumber);
    doc.save(fileName);
    onClose();
  };

  // Utilisation de useEffect pour générer le PDF après le rendu
  useEffect(() => {
    const generatePDFAsync = async () => {
      try {
        await generatePDF();
      } catch (error) {
        console.error('Erreur génération PDF:', error);
        // Afficher un message d'erreur à l'utilisateur si possible
        if (error instanceof Error) {
          // Ici on pourrait ajouter une notification ou un toast d'erreur
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
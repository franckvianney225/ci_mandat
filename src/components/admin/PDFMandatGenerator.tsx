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
  fonction?: string; // Fonction du demandeur
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

    
    const primaryColor: [number, number, number] = [0, 0, 0];
    
    let yPos = 10;

    // En-tête avec logos
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    
    // Logo RHDP à gauche - taille augmentée et centré verticalement
    const logoWidth = 170;
    const logoHeight = 30;
    const logoX = 20;
    const logoY = yPos + 10; // Position légèrement remontée pour mieux centrer
    const logoPath = '/logorhdp.png';
    
    // Fonction pour charger le logo avec fallback en base64
    const loadLogo = () => {
      try {
        // Essayer d'ajouter le logo normal
        doc.addImage(logoPath, 'PNG', logoX, logoY, logoWidth, logoHeight);
      } catch (error) {
        console.warn('Logo normal non trouvé, utilisation du logo base64');
        // Si le logo normal ne peut pas être chargé, utiliser le logo en base64
        // ICI: Insérer le code base64 du logo (copier depuis src/static/logo_base64.txt)
        const logoBase64 = '' // TODO: Copier le contenu de src/static/logo_base64.txt ici
        if (logoBase64) {
          doc.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
        }
      }
    };
    
    loadLogo();

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

    // Fonction pour dessiner du texte avec largeur fixe, gestion des débordements et couleur
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
    
    // Signature à droite - positionnée en dessous de la date
    // const signatureX = pageWidth - 60;
    // doc.setFont('helvetica', 'normal');
    // doc.setFontSize(10);
    // doc.text('Le Candidat', signatureX, yPos + 10, { align: 'center' });
    // doc.setFont('helvetica', 'bold');
    // doc.setFontSize(11);
    // doc.text(`${secureMandate.prenom} ${secureMandate.nom}`, signatureX, yPos + 25, { align: 'center' });
    

    // Signature en bas à droite
    const signaturePath = '/signature.png';
    const signatureWidth = 170;
    const signatureHeight = 90;
    const signatureX = pageWidth - signatureWidth + 30;
    const signatureY = pageHeight - signatureHeight - 10;
    
    // Fonction pour charger la signature avec fallback en base64
    const loadSignature = () => {
      try {
        // Essayer d'ajouter la signature normale
        doc.addImage(signaturePath, 'PNG', signatureX, signatureY, signatureWidth, signatureHeight);
      } catch (error) {
        console.warn('Signature normale non trouvée, utilisation de la signature base64');
        // Si la signature normale ne peut pas être chargée, utiliser la signature en base64
        // ICI: Insérer le code base64 de la signature (copier depuis src/static/signature_base64.txt)
        const signatureBase64 = ''; // TODO: Copier le contenu de src/static/signature_base64.txt ici
        if (signatureBase64) {
          doc.addImage(signatureBase64, 'PNG', signatureX, signatureY, signatureWidth, signatureHeight);
        }
      }
    };
    
    loadSignature();


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


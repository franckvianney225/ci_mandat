import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import { Mandate } from '../../entities/mandate.entity';

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);
  private readonly secretKey = process.env.PDF_SIGNATURE_SECRET || 'mandat-secret-key-2025';

  /**
   * Génère une signature cryptographique pour un mandat
   */
  generateSignature(mandate: Mandate): string {
    const dataToSign = `${mandate.id}-${mandate.referenceNumber}-${mandate.createdAt.getTime()}`;
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(dataToSign)
      .digest('hex')
      .substring(0, 16); // 16 caractères pour une signature courte
    
    return signature;
  }

  /**
   * Vérifie la signature d'un mandat
   */
  verifySignature(mandate: Mandate, signature: string): boolean {
    const expectedSignature = this.generateSignature(mandate);
    return signature === expectedSignature;
  }

  /**
   * Génère un numéro de référence sécurisé
   */
  generateSecureReference(mandate: Mandate): string {
    const signature = this.generateSignature(mandate);
    return `${mandate.referenceNumber}-${signature}`;
  }

  /**
   * Génère une URL de vérification pour un mandat
   */
  generateVerificationUrl(mandate: Mandate, baseUrl: string = 'http://localhost:3000'): string {
    const signature = this.generateSignature(mandate);
    return `${baseUrl}/verification?ref=${mandate.referenceNumber}&sig=${signature}`;
  }

  /**
   * Génère un QR code pour la vérification
   */
  async generateQRCode(mandate: Mandate, baseUrl?: string): Promise<string> {
    try {
      const verificationUrl = this.generateVerificationUrl(mandate, baseUrl);
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#FF8200', // Orange CI-Mandat
          light: '#FFFFFF'
        }
      });
      
      return qrCodeDataUrl;
    } catch (error) {
      this.logger.error(`Erreur lors de la génération du QR code pour le mandat ${mandate.id}:`, error);
      throw error;
    }
  }

  /**
   * Génère un QR code en buffer pour l'insertion dans PDF
   */
  async generateQRCodeBuffer(mandate: Mandate, baseUrl?: string): Promise<Buffer> {
    try {
      const verificationUrl = this.generateVerificationUrl(mandate, baseUrl);
      const qrCodeBuffer = await QRCode.toBuffer(verificationUrl, {
        width: 150,
        margin: 1,
        color: {
          dark: '#FF8200', // Orange CI-Mandat
          light: '#FFFFFF'
        }
      });
      
      return qrCodeBuffer;
    } catch (error) {
      this.logger.error(`Erreur lors de la génération du QR code buffer pour le mandat ${mandate.id}:`, error);
      throw error;
    }
  }

  /**
   * Vérifie un mandat à partir de sa référence et signature
   */
  async verifyMandate(referenceNumber: string, signature: string, mandate: Mandate): Promise<{
    isValid: boolean;
    mandate?: Mandate;
    message: string;
  }> {
    try {
      // Vérifier si le mandat existe
      if (!mandate) {
        return {
          isValid: false,
          message: 'Mandat non trouvé dans le systeme - Ce mandat pourrait être falsifié'
        };
      }

      // Vérifier la signature
      const isSignatureValid = this.verifySignature(mandate, signature);
      
      if (!isSignatureValid) {
        return {
          isValid: false,
          message: 'Signature invalide - Ce mandat pourrait être falsifié'
        };
      }

      // Vérifier si le mandat est approuvé (admin ou super admin) et non rejeté
      const isApproved =
        mandate.status === 'admin_approved' ||
        mandate.status === 'super_admin_approved';
      
      const isRejected = mandate.status === 'rejected';
      
      if (isRejected) {
        return {
          isValid: false,
          message: 'Mandat rejeté'
        };
      }
      
      if (!isApproved) {
        return {
          isValid: false,
          message: 'Mandat non approuvé'
        };
      }

      return {
        isValid: true,
        mandate,
        message: 'Mandat valide et authentique'
      };
    } catch (error) {
      this.logger.error(`Erreur lors de la vérification du mandat ${referenceNumber}:`, error);
      return {
        isValid: false,
        message: 'Erreur lors de la vérification'
      };
    }
  }
}
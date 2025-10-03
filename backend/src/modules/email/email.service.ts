
import { Injectable, Logger } from '@nestjs/common';
import { SettingsService, EmailConfig } from '../settings/settings.service';
import { Mandate } from '../../entities/mandate.entity';
import * as nodemailer from 'nodemailer';

export enum EmailType {
  SUBMISSION_CONFIRMATION = 'submission_confirmation',
  MANDATE_APPROVED = 'mandate_approved',
  MANDATE_REJECTED = 'mandate_rejected',
  ADMIN_NOTIFICATION = 'admin_notification'
}

interface EmailTemplateData {
  mandate: Mandate;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
  [key: string]: any;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private settingsService: SettingsService) {}

  /**
   * Envoie un email basé sur le type et les données fournies
   */
  async sendEmail(
    type: EmailType,
    to: string,
    data: EmailTemplateData,
    config?: EmailConfig
  ): Promise<boolean> {
    try {
      // Récupérer la configuration email si non fournie
      const emailConfig = config || await this.settingsService.getEmailConfig();
      
      if (!emailConfig.smtpHost || !emailConfig.smtpPort || !emailConfig.smtpUsername || !emailConfig.smtpPassword) {
        this.logger.warn('Configuration SMTP non disponible pour l\'envoi d\'email');
        return false;
      }

      const transporter = this.settingsService.createTransporter(emailConfig);

      // Générer le contenu de l'email selon le type
      const { subject, html, text } = this.generateEmailContent(type, data);

      const mailOptions: any = {
        from: `${emailConfig.fromName} <${emailConfig.fromEmail}>`,
        to: to,
        subject: subject,
        html: html,
        text: text,
      };

      // Ajouter les pièces jointes si présentes
      if (data.attachments && data.attachments.length > 0) {
        mailOptions.attachments = data.attachments;
      }

      const result = await transporter.sendMail(mailOptions);
      
      this.logger.log(`Email de type ${type} envoyé avec succès à ${to} (Message ID: ${result.messageId})`);
      return true;

    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi de l'email de type ${type} à ${to}:`, error);
      return false;
    }
  }

  /**
   * Génère le contenu de l'email selon le type
   */
  private generateEmailContent(type: EmailType, data: EmailTemplateData): { subject: string; html: string; text: string } {
    switch (type) {
      case EmailType.SUBMISSION_CONFIRMATION:
        return this.generateSubmissionConfirmationEmail(data);
      case EmailType.MANDATE_APPROVED:
        return this.generateMandateApprovedEmail(data);
      case EmailType.MANDATE_REJECTED:
        return this.generateMandateRejectedEmail(data);
      case EmailType.ADMIN_NOTIFICATION:
        return this.generateAdminNotificationEmail(data);
      default:
        throw new Error(`Type d'email non supporté: ${type}`);
    }
  }

  /**
   * Email de confirmation de soumission
   */
  private generateSubmissionConfirmationEmail(data: EmailTemplateData): { subject: string; html: string; text: string } {
    const { mandate } = data;
    const { formData, referenceNumber, createdAt } = mandate;
    
    const formattedDate = new Date(createdAt).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const subject = 'Confirmation de votre demande de mandat - CI-Mandat';
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Confirmation de demande de mandat</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #ddd;
    }
    .header {
      background: linear-gradient(135deg, #FF8200, #FFA500);
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
      margin: -20px -20px 20px -20px;
    }
    .content {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .info-item {
      margin-bottom: 10px;
      padding: 10px;
      background: #f8f9fa;
      border-left: 4px solid #FF8200;
    }
    .info-label {
      font-weight: bold;
      color: #FF8200;
    }
    .reference {
      background: #e7f3ff;
      border-left: 4px solid #1E40AF;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Confirmation de Demande de Mandat</h1>
      <p>Votre demande a été reçue avec succès</p>
    </div>
    
    <div class="content">
      <h2>Bonjour ${formData.prenom} ${formData.nom},</h2>
      
      <p>Nous accusons réception de votre demande de mandat soumise le <strong>${formattedDate}</strong>.</p>
      
      <div class="reference">
        <strong>Référence de votre demande:</strong><br>
        <span style="font-size: 18px; font-weight: bold; color: #1E40AF;">${referenceNumber}</span>
      </div>
      
      <h3>Récapitulatif de votre demande:</h3>
      
      <div class="info-item">
        <span class="info-label">Nom:</span> ${formData.nom}
      </div>
      
      <div class="info-item">
        <span class="info-label">Prénom:</span> ${formData.prenom}
      </div>
      
      <div class="info-item">
        <span class="info-label">Email:</span> ${formData.email}
      </div>
      
      <div class="info-item">
        <span class="info-label">Téléphone:</span> ${formData.telephone || 'Non spécifié'}
      </div>
      
      <div class="info-item">
        <span class="info-label">Fonction:</span> ${formData.fonction || 'Non spécifiée'}
      </div>
      
      <div class="info-item">
        <span class="info-label">Circonscription:</span> ${formData.circonscription || 'Non spécifiée'}
      </div>
      
      <p style="margin-top: 20px;">
        <strong>Prochaines étapes:</strong><br>
        Votre demande va maintenant être examinée par notre équipe. 
        Vous recevrez un email de confirmation une fois votre mandat validé.
      </p>
      
      <p>
        <strong>Durée de traitement estimée:</strong><br>
        Le traitement de votre demande peut prendre jusqu'à 5 jours ouvrables.
      </p>
    </div>
    
    <div class="footer">
      <p>Ceci est une confirmation automatique de votre demande de mandat.</p>
      <p>Merci de ne pas répondre à cet email.</p>
      <p>CI-Mandat - Système de gestion des mandats</p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `
Confirmation de Demande de Mandat - CI-Mandat

Bonjour ${formData.prenom} ${formData.nom},

Nous accusons réception de votre demande de mandat soumise le ${formattedDate}.

RÉFÉRENCE DE VOTRE DEMANDE: ${referenceNumber}

Récapitulatif de votre demande:
- Nom: ${formData.nom}
- Prénom: ${formData.prenom}
- Email: ${formData.email}
- Téléphone: ${formData.telephone || 'Non spécifié'}
- Fonction: ${formData.fonction || 'Non spécifiée'}
- Circonscription: ${formData.circonscription || 'Non spécifiée'}

Prochaines étapes:
Votre demande va maintenant être examinée par notre équipe. 
Vous recevrez un email de confirmation une fois votre mandat validé.

Durée de traitement estimée:
Le traitement de votre demande peut prendre jusqu'à 5 jours ouvrables.

Ceci est une confirmation automatique de votre demande de mandat.
Merci de ne pas répondre à cet email.

CI-Mandat - Système de gestion des mandats
    `;

    return { subject, html, text };
  }

  /**
   * Email de validation de mandat
   */
  private generateMandateApprovedEmail(data: EmailTemplateData): { subject: string; html: string; text: string } {
    const { mandate } = data;
    const { formData, referenceNumber, superAdminApprovedAt } = mandate;
    
    const approvalDate = new Date(superAdminApprovedAt || new Date()).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const subject = 'Votre mandat a été validé - CI-Mandat';
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Mandat Validé</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #ddd;
    }
    .header {
      background: linear-gradient(135deg, #10B981, #059669);
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
      margin: -20px -20px 20px -20px;
    }
    .content {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .success-badge {
      background: #D1FAE5;
      color: #065F46;
      padding: 10px 15px;
      border-radius: 20px;
      font-weight: bold;
      display: inline-block;
      margin: 10px 0;
    }
    .info-item {
      margin-bottom: 10px;
      padding: 10px;
      background: #f8f9fa;
      border-left: 4px solid #10B981;
    }
    .info-label {
      font-weight: bold;
      color: #10B981;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      margin-top: 20px;
    }
    .button {
      display: inline-block;
      background: #10B981;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 4px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Mandat Validé</h1>
      <p>Félicitations ! Votre mandat a été approuvé</p>
    </div>
    
    <div class="content">
      <div class="success-badge">
        ✅ MANDAT VALIDÉ LE ${approvalDate}
      </div>
      
      <h2>Bonjour ${formData.prenom} ${formData.nom},</h2>
      
      <p>Nous avons le plaisir de vous informer que votre demande de mandat <strong>${referenceNumber}</strong> a été validée avec succès.</p>
      
      <h3>Détails du mandat validé:</h3>
      
      <div class="info-item">
        <span class="info-label">Référence:</span> ${referenceNumber}
      </div>
      
      <div class="info-item">
        <span class="info-label">Nom:</span> ${formData.nom}
      </div>
      
      <div class="info-item">
        <span class="info-label">Prénom:</span> ${formData.prenom}
      </div>
      
      <div class="info-item">
        <span class="info-label">Fonction:</span> ${formData.fonction || 'Non spécifiée'}
      </div>
      
      <div class="info-item">
        <span class="info-label">Circonscription:</span> ${formData.circonscription || 'Non spécifiée'}
      </div>
      
      <div class="info-item">
        <span class="info-label">Date de validation:</span> ${approvalDate}
      </div>
    </div>
    
    <div class="footer">
      <p>Ceci est une notification automatique de validation de mandat.</p>
      <p>Merci de ne pas répondre à cet email.</p>
      <p>CI-Mandat - Système de gestion des mandats</p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `
Mandat Validé - CI-Mandat

Félicitations ! Votre mandat a été approuvé

Bonjour ${formData.prenom} ${formData.nom},

Nous avons le plaisir de vous informer que votre demande de mandat ${referenceNumber} a été validée avec succès.

DÉTAILS DU MANDAT VALIDÉ:
- Référence: ${referenceNumber}
- Nom: ${formData.nom}
- Prénom: ${formData.prenom}
- Fonction: ${formData.fonction || 'Non spécifiée'}
- Circonscription: ${formData.circonscription || 'Non spécifiée'}
- Date de validation: ${approvalDate}

Ceci est une notification automatique de validation de mandat.
Merci de ne pas répondre à cet email.

CI-Mandat - Système de gestion des mandats
    `;

    return { subject, html, text };
  }

  /**
   * Email de rejet de mandat
   */
  private generateMandateRejectedEmail(data: EmailTemplateData): { subject: string; html: string; text: string } {
    const { mandate } = data;
    const { formData, referenceNumber, rejectionReason, rejectedAt } = mandate;
    
    const rejectionDate = new Date(rejectedAt || new Date()).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const subject = 'Décision concernant votre demande de mandat - CI-Mandat';
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Décision sur votre mandat</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #ddd;
    }
    .header {
      background: linear-gradient(135deg, #EF4444, #DC2626);
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
      margin: -20px -20px 20px -20px;
    }
    .content {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .rejection-notice {
      background: #FEE2E2;
      color: #991B1B;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #EF4444;
      margin: 15px 0;
    }
    .info-item {
      margin-bottom: 10px;
      padding: 10px;
      background: #f8f9fa;
      border-left: 4px solid #6B7280;
    }
    .info-label {
      font-weight: bold;
      color: #6B7280;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      margin-top: 20px;
    }
    .contact-info {
      background: #EFF6FF;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Décision sur votre mandat</h1>
      <p>Information concernant votre demande ${referenceNumber}</p>
    </div>
    
    <div class="content">
      <div class="rejection-notice">
        <strong>⚠️ VOTRE DEMANDE N'A PAS PU ÊTRE APPROUVÉE</strong>
      </div>
      
      <h2>Bonjour ${formData.prenom} ${formData.nom},</h2>
      
      <p>Nous regrettons de vous informer que votre demande de mandat <strong>${referenceNumber}</strong> n'a pas pu être approuvée.</p>
      
      <h3>Motif du rejet:</h3>
      <div class="info-item">
        ${rejectionReason || 'Aucun motif spécifique fourni'}
      </div>
      
      <h3>Détails de la décision:</h3>
      
      <div class="info-item">
        <span class="info-label">Référence:</span> ${referenceNumber}
      </div>
      
      <div class="info-item">
        <span class="info-label">Date de décision:</span> ${rejectionDate}
      </div>
      
      <div class="contact-info">
        <strong>Pour plus d'informations:</strong><br>
        Si vous souhaitez obtenir des précisions sur cette décision ou soumettre une nouvelle demande,
        veuillez contacter notre service au support@ci-mandat.ci ou par téléphone au +225 XX XX XX XX.
      </div>
      
      <p>
        Nous vous remercions de votre compréhension et restons à votre disposition pour toute information complémentaire.
      </p>
    </div>
    
    <div class="footer">
      <p>Ceci est une notification automatique concernant votre demande de mandat.</p>
      <p>Merci de ne pas répondre à cet email.</p>
      <p>CI-Mandat - Système de gestion des mandats</p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `
Décision concernant votre demande de mandat - CI-Mandat

Bonjour ${formData.prenom} ${formData.nom},

Nous regrettons de vous informer que votre demande de mandat ${referenceNumber} n'a pas pu être approuvée.

MOTIF DU REJET:
${rejectionReason || 'Aucun motif spécifique fourni'}

DÉTAILS DE LA DÉCISION:
- Référence: ${referenceNumber}
- Date de décision: ${rejectionDate}

POUR PLUS D'INFORMATIONS:
Si vous souhaitez obtenir des précisions sur cette décision ou soumettre une nouvelle demande,
veuillez contacter notre service au support@ci-mandat.ci ou par téléphone au +225 XX XX XX XX.

Nous vous remercions de votre compréhension et restons à votre disposition pour toute information complémentaire.

Ceci est une notification automatique concernant votre demande de mandat.
Merci de ne pas répondre à cet email.

CI-Mandat - Système de gestion des mandats
    `;

    return { subject, html, text };
  }

  /**
   * Email de notification aux administrateurs (existant dans mandates.service.ts)
   */
  private generateAdminNotificationEmail(data: EmailTemplateData): { subject: string; html: string; text: string } {
    const { mandate } = data;
    const { formData, createdAt } = mandate;
    const formattedDate = new Date(createdAt).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const subject = 'Nouvelle demande de mandat reçue';
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Nouvelle demande de mandat</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #ddd;
    }
    .header {
      background: #1E40AF;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
      margin: -20px -20px 20px -20px;
    }
    .content {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .info-item {
      margin-bottom: 10px;
      padding: 10px;
      background: #f8f9fa;
      border-left: 4px solid #1E40AF;
    }
    .info-label {
      font-weight: bold;
      color: #1E40AF;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      margin-top: 20px;
    }
    .button {
      display: inline-block;
      background: #1E40AF;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 4px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Nouvelle Demande de Mandat</h1>
      <p>Une nouvelle demande a été soumise le ${formattedDate}</p>
    </div>
    
    <div class="content">
      <h2>Informations du demandeur</h2>
      
      <div class="info-item">
        <span class="info-label">Nom:</span> ${formData.nom}
      </div>
      
      <div class="info-item">
        <span class="info-label">Prénom:</span> ${formData.prenom}
      </div>
      
      <div class="info-item">
        <span class="info-label">Email:</span> ${formData.email}
      </div>
      
      <div class="info-item">
        <span class="info-label">Téléphone:</span> ${formData.telephone || 'Non spécifié'}
      </div>
      
      <div class="info-item">
        <span class="info-label">Fonction:</span> ${formData.fonction || 'Non spécifiée'}
      </div>
      
      <div class="info-item">
        <span class="info-label">Circonscription:</span> ${formData.circonscription || 'Non spécifiée'}
      </div>
      
      <p style="margin-top: 20px;">
        <a href="http://localhost:3000/ci-mandat-admin" class="button">
          Voir la demande dans l'administration
        </a>
      </p>
    </div>
    
    <div class="footer">
      <p>Ceci est une notification automatique du système de gestion des mandats.</p>
      <p>Merci de ne pas répondre à cet email.</p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `
Nouvelle demande de mandat reçue

Une nouvelle demande a été soumise le ${formattedDate}

INFORMATIONS DU DEMANDEUR:
- Nom: ${formData.nom}
- Prénom: ${formData.prenom}
- Email: ${formData.email}
- Téléphone: ${formData.telephone || 'Non spécifié'}
- Fonction: ${formData.fonction || 'Non spécifiée'}
- Circonscription: ${formData.circonscription || 'Non spécifiée'}

Connectez-vous à l'administration pour voir la demande: http://localhost:3000/ci-mandat-admin

Ceci est une notification automatique du système de gestion des mandats.
Merci de ne pas répondre à cet email.
    `;

    return { subject, html, text };
  }
}
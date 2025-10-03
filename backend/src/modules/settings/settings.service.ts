import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { EmailConfigEntity } from '../../entities/email-config.entity';

export interface EmailConfig {
  smtpHost: string;
  smtpPort: string;
  smtpUsername: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  useSSL: boolean;
  useTLS: boolean;
}

@Injectable()
export class SettingsService {
  
  constructor(
    @InjectRepository(EmailConfigEntity)
    private readonly emailConfigRepository: Repository<EmailConfigEntity>
  ) {}

  async getEmailConfig(): Promise<EmailConfig> {
    // Récupérer la configuration depuis la base de données
    const configs = await this.emailConfigRepository.find({
      order: { updatedAt: 'DESC' },
      take: 1
    });

    if (configs.length > 0) {
      const config = configs[0];
      return {
        smtpHost: config.smtpHost,
        smtpPort: config.smtpPort,
        smtpUsername: config.smtpUsername,
        smtpPassword: config.smtpPassword,
        fromEmail: config.fromEmail,
        fromName: config.fromName,
        useSSL: config.useSSL,
        useTLS: config.useTLS,
      };
    }

    // Retourner les valeurs par défaut si aucune configuration n'existe
    return {
      smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
      smtpPort: process.env.SMTP_PORT || '587',
      smtpUsername: process.env.SMTP_USER || '',
      smtpPassword: process.env.SMTP_PASS || '',
      fromEmail: process.env.EMAIL_FROM || 'noreply@ci-mandat.ci',
      fromName: process.env.EMAIL_FROM_NAME || 'CI-Mandat',
      useSSL: process.env.SMTP_SSL === 'true',
      useTLS: process.env.SMTP_TLS !== 'false',
    };
  }

  async updateEmailConfig(config: EmailConfig): Promise<void> {
    // Sauvegarder la configuration en base de données
    const existingConfigs = await this.emailConfigRepository.find({
      order: { updatedAt: 'DESC' },
      take: 1
    });

    if (existingConfigs.length > 0) {
      // Mettre à jour la configuration existante
      const existingConfig = existingConfigs[0];
      await this.emailConfigRepository.update(existingConfig.id, {
        smtpHost: config.smtpHost,
        smtpPort: config.smtpPort,
        smtpUsername: config.smtpUsername,
        smtpPassword: config.smtpPassword,
        fromEmail: config.fromEmail,
        fromName: config.fromName,
        useSSL: config.useSSL,
        useTLS: config.useTLS,
      });
    } else {
      // Créer une nouvelle configuration
      const newConfig = this.emailConfigRepository.create({
        smtpHost: config.smtpHost,
        smtpPort: config.smtpPort,
        smtpUsername: config.smtpUsername,
        smtpPassword: config.smtpPassword,
        fromEmail: config.fromEmail,
        fromName: config.fromName,
        useSSL: config.useSSL,
        useTLS: config.useTLS,
      });
      await this.emailConfigRepository.save(newConfig);
    }

    console.log('Configuration SMTP sauvegardée en base de données:', {
      smtpHost: config.smtpHost,
      smtpPort: config.smtpPort,
      smtpUsername: config.smtpUsername,
      smtpPassword: config.smtpPassword ? '***' : 'vide',
      fromEmail: config.fromEmail,
      fromName: config.fromName,
      useSSL: config.useSSL,
      useTLS: config.useTLS,
    });
  }

  async testEmailConnection(config: EmailConfig): Promise<boolean> {
    // Test réel de connexion SMTP avec NodeMailer
    const transporter = this.createTransporter(config);
    
    try {
      // Vérifier la connexion SMTP
      await transporter.verify();
      console.log('✅ Connexion SMTP réussie');
      return true;
    } catch (error) {
      console.error('❌ Erreur de connexion SMTP:', error);
      throw new Error(`Échec de la connexion SMTP: ${error.message}`);
    }
  }

  async sendTestEmail(config: EmailConfig, testEmail: string): Promise<boolean> {
    // Envoi réel d'email de test avec NodeMailer
    
    // Vérification basique des champs requis
    if (!config.smtpHost || !config.smtpPort || !config.smtpUsername || !config.smtpPassword) {
      throw new Error('Tous les champs SMTP sont requis pour l\'envoi d\'email');
    }

    if (!testEmail || !testEmail.includes('@')) {
      throw new Error('Adresse email de test invalide');
    }

    const transporter = this.createTransporter(config);
    
    try {
      // Envoyer l'email de test
      const mailOptions = {
        from: `${config.fromName} <${config.fromEmail}>`,
        to: testEmail,
        subject: 'Test de configuration SMTP - CI-Mandat',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #FF8200, #FFA500); padding: 20px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 24px;">CI-Mandat</h1>
              <p style="margin: 5px 0 0 0; font-size: 16px;">Test de configuration SMTP</p>
            </div>
            <div style="padding: 20px; background: #f9f9f9;">
              <h2 style="color: #333; margin-bottom: 15px;">Bonjour,</h2>
              <p style="color: #666; line-height: 1.6;">
                Ceci est un email de test pour vérifier que votre configuration SMTP fonctionne correctement.
              </p>
              <p style="color: #666; line-height: 1.6;">
                Si vous recevez cet email, cela signifie que les paramètres SMTP de votre application CI-Mandat sont correctement configurés.
              </p>
              <div style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #FF8200; margin: 20px 0;">
                <p style="margin: 0; color: #333;">
                  <strong>Configuration utilisée:</strong><br>
                  Serveur: ${config.smtpHost}:${config.smtpPort}<br>
                  Expéditeur: ${config.fromName} <${config.fromEmail}>
                </p>
              </div>
              <p style="color: #666; line-height: 1.6;">
                Vous pouvez maintenant utiliser cette configuration pour envoyer des notifications et des mandats par email.
              </p>
            </div>
            <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
              <p style="margin: 0;">
                Cet email a été envoyé automatiquement par l'application CI-Mandat.<br>
                Ne répondez pas à cet email.
              </p>
            </div>
          </div>
        `,
        text: `Test de configuration SMTP - CI-Mandat

Bonjour,

Ceci est un email de test pour vérifier que votre configuration SMTP fonctionne correctement.

Si vous recevez cet email, cela signifie que les paramètres SMTP de votre application CI-Mandat sont correctement configurés.

Configuration utilisée:
- Serveur: ${config.smtpHost}:${config.smtpPort}
- Expéditeur: ${config.fromName} <${config.fromEmail}>

Vous pouvez maintenant utiliser cette configuration pour envoyer des notifications et des mandats par email.

Cet email a été envoyé automatiquement par l'application CI-Mandat.
Ne répondez pas à cet email.`
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('📧 Email de test envoyé avec succès:', {
        messageId: result.messageId,
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      });
      
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de l\'email de test:', error);
      throw new Error(`Échec de l'envoi de l'email: ${error.message}`);
    }
  }

  private createTransporter(config: EmailConfig): nodemailer.Transporter {
    return nodemailer.createTransport({
      host: config.smtpHost,
      port: parseInt(config.smtpPort),
      secure: config.useSSL, // true pour SSL, false pour TLS
      auth: {
        user: config.smtpUsername,
        pass: config.smtpPassword,
      },
      tls: {
        rejectUnauthorized: false // Pour éviter les erreurs de certificat en développement
      }
    });
  }
}
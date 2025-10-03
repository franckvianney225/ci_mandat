import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    // Simulation d'un test de connexion SMTP
    // Dans une vraie implémentation, on testerait réellement la connexion
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Vérification basique des champs requis
    if (!config.smtpHost || !config.smtpPort || !config.smtpUsername || !config.smtpPassword) {
      throw new Error('Tous les champs SMTP sont requis pour le test');
    }

    return true;
  }
}
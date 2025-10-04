import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface RecaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

@Injectable()
export class RecaptchaService {
  private readonly logger = new Logger(RecaptchaService.name);
  private readonly secretKey: string;
  private readonly verificationUrl = 'https://www.google.com/recaptcha/api/siteverify';
  private readonly minimumScore = 0.5; // Score minimum pour considérer comme humain

  constructor(private configService: ConfigService) {
    this.secretKey = this.configService.get<string>('RECAPTCHA_SECRET_KEY');
    
    if (!this.secretKey) {
      this.logger.warn('RECAPTCHA_SECRET_KEY non configurée. La vérification reCAPTCHA sera désactivée.');
    }
    
    // En développement, on peut désactiver temporairement la vérification reCAPTCHA pour les tests
    if (this.configService.get<string>('NODE_ENV') === 'development') {
      this.logger.warn('Mode développement - Vérification reCAPTCHA désactivée pour les tests');
    }
  }

  /**
   * Vérifie un token reCAPTCHA v3
   * @param token Le token reCAPTCHA à vérifier
   * @param expectedAction L'action attendue (optionnelle)
   * @returns Promise<boolean> true si la vérification est réussie
   */
  async verifyToken(token: string, expectedAction?: string): Promise<boolean> {
    // En développement, on désactive temporairement la vérification pour les tests
    if (this.configService.get<string>('NODE_ENV') === 'development') {
      this.logger.debug('Mode développement - Vérification reCAPTCHA ignorée');
      return true;
    }
    
    // Si la clé secrète n'est pas configurée, on désactive la vérification
    if (!this.secretKey) {
      this.logger.warn('Vérification reCAPTCHA désactivée - clé secrète non configurée');
      return true;
    }

    if (!token) {
      this.logger.warn('Token reCAPTCHA manquant');
      throw new BadRequestException('Token de sécurité manquant');
    }

    try {
      const response = await axios.post<RecaptchaResponse>(
        this.verificationUrl,
        null,
        {
          params: {
            secret: this.secretKey,
            response: token,
          },
          timeout: 5000, // Timeout de 5 secondes
        }
      );

      const { data } = response;

      this.logger.debug(`Réponse reCAPTCHA: ${JSON.stringify(data)}`);

      if (!data.success) {
        this.logger.warn(`Échec de la vérification reCAPTCHA: ${data['error-codes']?.join(', ') || 'Raison inconnue'}`);
        return false;
      }

      // Vérifier le score de confiance
      if (data.score !== undefined && data.score < this.minimumScore) {
        this.logger.warn(`Score reCAPTCHA trop faible: ${data.score} (minimum: ${this.minimumScore})`);
        return false;
      }

      // Vérifier l'action si spécifiée
      if (expectedAction && data.action !== expectedAction) {
        this.logger.warn(`Action reCAPTCHA non correspondante: ${data.action} (attendue: ${expectedAction})`);
        return false;
      }

      this.logger.log(`Vérification reCAPTCHA réussie - Score: ${data.score}, Action: ${data.action}`);
      return true;

    } catch (error) {
      this.logger.error('Erreur lors de la vérification reCAPTCHA:', error);
      
      // En cas d'erreur de réseau ou de timeout, on accepte la requête
      // pour éviter de bloquer les utilisateurs légitimes
      // Dans un environnement de production, vous pourriez vouloir être plus strict
      this.logger.warn('Erreur de vérification reCAPTCHA - Acceptation de la requête par défaut');
      return true;
    }
  }

  /**
   * Vérifie un token reCAPTCHA et lève une exception si la vérification échoue
   * @param token Le token reCAPTCHA à vérifier
   * @param expectedAction L'action attendue (optionnelle)
   */
  async verifyTokenOrThrow(token: string, expectedAction?: string): Promise<void> {
    const isValid = await this.verifyToken(token, expectedAction);
    
    if (!isValid) {
      throw new BadRequestException('Échec de la vérification de sécurité. Veuillez réessayer.');
    }
  }
}
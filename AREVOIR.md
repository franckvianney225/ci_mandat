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


    
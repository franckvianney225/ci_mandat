import { Controller, Get, Post, Body, UseGuards, Inject } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { SettingsService, EmailConfig } from './settings.service';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  
  constructor(
    @Inject(SettingsService)
    private readonly settingsService: SettingsService
  ) {}

  @Get('email')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getEmailConfig(): Promise<{ success: boolean; data?: EmailConfig; error?: string }> {
    try {
      const config = await this.settingsService.getEmailConfig();
      return {
        success: true,
        data: config
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de la configuration email:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération de la configuration'
      };
    }
  }

  @Post('email')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateEmailConfig(@Body() config: EmailConfig): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      await this.settingsService.updateEmailConfig(config);
      return {
        success: true,
        message: 'Configuration SMTP sauvegardée avec succès'
      };
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration email:', error);
      return {
        success: false,
        error: 'Erreur lors de la sauvegarde de la configuration'
      };
    }
  }

  @Post('email/test')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async testEmailConnection(@Body() config: EmailConfig): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      await this.settingsService.testEmailConnection(config);
      return {
        success: true,
        message: 'Connexion SMTP réussie ! Les paramètres sont corrects.'
      };
    } catch (error) {
      console.error('Erreur lors du test de connexion SMTP:', error);
      return {
        success: false,
        error: error.message || 'Échec de la connexion SMTP. Vérifiez vos paramètres.'
      };
    }
  }

  @Post('email/send-test')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async sendTestEmail(@Body() body: EmailConfig & { testEmail: string }): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const { testEmail, ...config } = body;
      await this.settingsService.sendTestEmail(config, testEmail);
      return {
        success: true,
        message: `Email de test envoyé avec succès à ${testEmail} !`
      };
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de test:', error);
      return {
        success: false,
        error: error.message || 'Échec de l\'envoi de l\'email de test. Vérifiez vos paramètres.'
      };
    }
  }
}
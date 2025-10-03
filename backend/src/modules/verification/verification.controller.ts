import {
  Controller,
  Get,
  Query,
  Res,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { MandatesService } from '../mandates/mandates.service';
import { SecurityService } from '../security/security.service';

@Controller('verification')
export class VerificationController {
  private readonly logger = new Logger(VerificationController.name);

  constructor(
    private mandatesService: MandatesService,
    private securityService: SecurityService,
  ) {}

  @Get()
  async verifyMandate(
    @Query('ref') referenceNumber: string,
    @Query('sig') signature: string,
    @Res() res: Response,
  ) {
    try {
      this.logger.log(`Tentative de vérification du mandat: ${referenceNumber}`);

      // Vérifier les paramètres requis
      if (!referenceNumber || !signature) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Paramètres manquants. Utilisez ref et sig.',
          help: 'Exemple: /verification?ref=MND-123456&sig=abc123def456'
        });
      }

      // Trouver le mandat par référence
      let mandate;
      try {
        // Récupérer tous les mandats et trouver celui avec la référence
        const mandatesResponse = await this.mandatesService.findAll({});
        mandate = mandatesResponse.data.find(m => m.referenceNumber === referenceNumber);
      } catch (error) {
        this.logger.error(`Erreur lors de la recherche du mandat ${referenceNumber}:`, error);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: 'Erreur lors de la vérification'
        });
      }

      // Vérifier le mandat
      const verificationResult = await this.securityService.verifyMandate(
        referenceNumber,
        signature,
        mandate
      );

      // Préparer la réponse HTML
      const htmlResponse = this.generateVerificationHtml(verificationResult, referenceNumber);

      return res.status(HttpStatus.OK).send(htmlResponse);

    } catch (error) {
      this.logger.error(`Erreur lors de la vérification:`, error);
      const errorHtml = this.generateErrorHtml('Erreur lors de la vérification');
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(errorHtml);
    }
  }

  @Get('verify')
  async verifyMandateApi(
    @Query('ref') referenceNumber: string,
    @Query('sig') signature: string,
  ) {
    try {
      this.logger.log(`Tentative de vérification API du mandat: ${referenceNumber}`);

      // Vérifier les paramètres requis
      if (!referenceNumber || !signature) {
        return {
          isValid: false,
          message: 'Paramètres manquants. Utilisez ref et sig.'
        };
      }

      // Trouver le mandat par référence
      let mandate;
      try {
        // Récupérer tous les mandats et trouver celui avec la référence
        const mandatesResponse = await this.mandatesService.findAll({});
        mandate = mandatesResponse.data.find(m => m.referenceNumber === referenceNumber);
      } catch (error) {
        this.logger.error(`Erreur lors de la recherche du mandat ${referenceNumber}:`, error);
        return {
          isValid: false,
          message: 'Erreur lors de la vérification'
        };
      }

      // Vérifier le mandat
      const verificationResult = await this.securityService.verifyMandate(
        referenceNumber,
        signature,
        mandate
      );

      return verificationResult;

    } catch (error) {
      this.logger.error(`Erreur lors de la vérification API:`, error);
      return {
        isValid: false,
        message: 'Erreur lors de la vérification'
      };
    }
  }

  private generateVerificationHtml(result: any, referenceNumber: string): string {
    const isValid = result.isValid;
    const mandate = result.mandate;
    const message = result.message;

    const statusColor = isValid ? 'green' : 'red';
    const statusIcon = isValid ? '✅' : '❌';
    const statusText = isValid ? 'VALIDE' : 'INVALIDE';

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vérification de Mandat - CEI</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .container {
            background: white;
            border-radius: 15px;
            padding: 40px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            max-width: 500px;
            width: 100%;
            text-align: center;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 20px;
        }
        .status {
            font-size: 32px;
            font-weight: bold;
            margin: 20px 0;
            color: ${statusColor};
        }
        .reference {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
            margin: 15px 0;
            font-family: monospace;
        }
        .info {
            text-align: left;
            margin: 20px 0;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .message {
            margin: 20px 0;
            padding: 15px;
            border-radius: 8px;
            background: ${isValid ? '#d4edda' : '#f8d7da'};
            color: ${isValid ? '#155724' : '#721c24'};
            border: 1px solid ${isValid ? '#c3e6cb' : '#f5c6cb'};
        }
        .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">COMMISSION ÉLECTORALE INDÉPENDANTE</div>
        
        <div class="status">
            ${statusIcon} ${statusText}
        </div>
        
        <div class="reference">
            Référence: ${referenceNumber}
        </div>
        
        ${mandate ? `
        <div class="info">
            <strong>Informations du mandat:</strong><br>
            • Nom: ${mandate.formData.nom}<br>
            • Prénom: ${mandate.formData.prenom}<br>
            • Circonscription: ${mandate.formData.circonscription}<br>
            • Statut: ${mandate.status}<br>
            • Date de création: ${new Date(mandate.createdAt).toLocaleDateString('fr-FR')}
        </div>
        ` : ''}
        
        <div class="message">
            ${message}
        </div>
        
        <div class="footer">
            Système de vérification sécurisé - CEI 2025
        </div>
    </div>
</body>
</html>
    `;
  }

  private generateErrorHtml(message: string): string {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Erreur de Vérification - CEI</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .container {
            background: white;
            border-radius: 15px;
            padding: 40px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            max-width: 500px;
            width: 100%;
            text-align: center;
        }
        .error {
            color: #dc3545;
            font-size: 24px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">COMMISSION ÉLECTORALE INDÉPENDANTE</div>
        <div class="error">❌ ${message}</div>
        <p>Veuillez réessayer ou contacter l'administration.</p>
    </div>
</body>
</html>
    `;
  }
}
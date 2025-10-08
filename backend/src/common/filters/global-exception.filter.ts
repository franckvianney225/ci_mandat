import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WinstonLogger } from '../logger/winston.logger';
import { ConfigService } from '@nestjs/config';

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string;
  error?: string;
  details?: any;
  requestId?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(WinstonLogger) private readonly logger: WinstonLogger,
    private readonly configService: ConfigService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Générer un ID de requête pour le tracking
    const requestId = this.generateRequestId();

    let status: number;
    let message: string;
    let error: string;
    let details: any;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        error = responseObj.error || exception.name;
        details = responseObj.details;
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Erreur interne du serveur';
      error = exception.name;
      
      // En production, ne pas exposer les détails des erreurs internes
      if (process.env.NODE_ENV !== 'production') {
        details = exception.stack;
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Erreur interne inattendue';
      error = 'UnknownError';
    }

    // Construire la réponse d'erreur
    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
      requestId,
    };

    // Ajouter les détails si disponibles
    if (details) {
      errorResponse.details = details;
    }

    // Loguer l'erreur
    this.logError(exception, request, status, requestId);

    // Envoyer la réponse
    response.status(status).json(errorResponse);
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logError(
    exception: unknown,
    request: Request,
    status: number,
    requestId: string,
  ) {
    const logContext = {
      requestId,
      url: request.url,
      method: request.method,
      ip: request.ip,
      userAgent: request.get('user-agent'),
      userId: (request as any).user?.id,
      statusCode: status,
    };

    if (exception instanceof HttpException) {
      if (status >= 500) {
        this.logger.error(
          `Erreur serveur: ${exception.message}`,
          exception.stack,
          'GlobalExceptionFilter',
          logContext,
        );
      } else {
        this.logger.warn(
          `Erreur client: ${exception.message}`,
          'GlobalExceptionFilter',
          logContext,
        );
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Erreur non gérée: ${exception.message}`,
        exception.stack,
        'GlobalExceptionFilter',
        logContext,
      );
    } else {
      this.logger.error(
        'Erreur inconnue',
        JSON.stringify(exception),
        'GlobalExceptionFilter',
        logContext,
      );
    }
  }
}
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { WinstonLogger } from '../logger/winston.logger';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WinstonLogger) private readonly logger: WinstonLogger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const startTime = Date.now();
    const requestId = this.generateRequestId();

    // Log de la requête entrante
    this.logRequest(request, requestId);

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          this.logResponse(request, response, duration, requestId, data);
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logError(request, response, duration, requestId, error);
        },
      }),
    );
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logRequest(request: Request, requestId: string) {
    const logData = {
      requestId,
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.get('user-agent'),
      userId: (request as any).user?.id,
      query: request.query,
      body: this.sanitizeBody(request.body),
    };

    this.logger.http('Requête HTTP reçue', logData);
  }

  private logResponse(
    request: Request,
    response: Response,
    duration: number,
    requestId: string,
    data: any,
  ) {
    const logData = {
      requestId,
      method: request.method,
      url: request.url,
      statusCode: response.statusCode,
      duration: `${duration}ms`,
      userId: (request as any).user?.id,
      responseSize: this.getResponseSize(data),
    };

    if (response.statusCode >= 400) {
      this.logger.warn('Réponse HTTP avec erreur', 'LoggingInterceptor', logData);
    } else {
      this.logger.http('Réponse HTTP envoyée', logData);
    }
  }

  private logError(
    request: Request,
    response: Response,
    duration: number,
    requestId: string,
    error: any,
  ) {
    const logData = {
      requestId,
      method: request.method,
      url: request.url,
      statusCode: response.statusCode,
      duration: `${duration}ms`,
      userId: (request as any).user?.id,
      error: error.message,
      errorStack: error.stack,
    };

    this.logger.error('Erreur lors du traitement de la requête', error.stack, 'LoggingInterceptor', logData);
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sanitized = { ...body };

    // Masquer les champs sensibles
    const sensitiveFields = [
      'password',
      'currentPassword',
      'newPassword',
      'confirmPassword',
      'token',
      'accessToken',
      'refreshToken',
      'authorization',
    ];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***';
      }
    });

    return sanitized;
  }

  private getResponseSize(data: any): string {
    if (!data) return '0B';

    try {
      const jsonString = JSON.stringify(data);
      const bytes = Buffer.byteLength(jsonString, 'utf8');
      
      if (bytes < 1024) return `${bytes}B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
    } catch {
      return 'unknown';
    }
  }
}
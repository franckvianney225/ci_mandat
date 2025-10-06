import { Injectable, Logger } from '@nestjs/common';

interface CacheItem {
  value: any;
  expiresAt: number;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private cache = new Map<string, CacheItem>();

  /**
   * Stocke un PDF en cache avec TTL
   */
  async cachePDF(referenceNumber: string, pdfBuffer: Buffer, ttlSeconds: number = 86400): Promise<void> {
    try {
      const key = `pdf:${referenceNumber}`;
      const expiresAt = Date.now() + (ttlSeconds * 1000);
      
      this.cache.set(key, {
        value: pdfBuffer.toString('base64'),
        expiresAt
      });
      
      this.logger.log(`PDF cached for reference: ${referenceNumber}, TTL: ${ttlSeconds}s`);
    } catch (error) {
      this.logger.error(`Failed to cache PDF for ${referenceNumber}:`, error);
      throw error;
    }
  }

  /**
   * Récupère un PDF depuis le cache
   */
  async getCachedPDF(referenceNumber: string): Promise<Buffer | null> {
    try {
      const key = `pdf:${referenceNumber}`;
      const cachedItem = this.cache.get(key);
      
      if (cachedItem) {
        // Vérifier si l'élément a expiré
        if (Date.now() > cachedItem.expiresAt) {
          this.cache.delete(key);
          this.logger.log(`PDF cache expired for reference: ${referenceNumber}`);
          return null;
        }
        
        this.logger.log(`PDF cache hit for reference: ${referenceNumber}`);
        return Buffer.from(cachedItem.value, 'base64');
      }
      
      this.logger.log(`PDF cache miss for reference: ${referenceNumber}`);
      return null;
    } catch (error) {
      this.logger.error(`Failed to get cached PDF for ${referenceNumber}:`, error);
      return null;
    }
  }

  /**
   * Supprime un PDF du cache
   */
  async deleteCachedPDF(referenceNumber: string): Promise<void> {
    try {
      const key = `pdf:${referenceNumber}`;
      this.cache.delete(key);
      this.logger.log(`PDF cache deleted for reference: ${referenceNumber}`);
    } catch (error) {
      this.logger.error(`Failed to delete cached PDF for ${referenceNumber}:`, error);
      throw error;
    }
  }

  /**
   * Stocke le statut d'une génération PDF
   */
  async setPDFGenerationStatus(jobId: string, status: 'pending' | 'processing' | 'completed' | 'failed', data?: any): Promise<void> {
    try {
      const key = `pdf_job:${jobId}`;
      const statusData = {
        status,
        data,
        timestamp: new Date().toISOString(),
      };
      
      // TTL 1h
      const expiresAt = Date.now() + (3600 * 1000);
      this.cache.set(key, {
        value: JSON.stringify(statusData),
        expiresAt
      });
    } catch (error) {
      this.logger.error(`Failed to set PDF generation status for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Récupère le statut d'une génération PDF
   */
  async getPDFGenerationStatus(jobId: string): Promise<{ status: string; data?: any; timestamp: string } | null> {
    try {
      const key = `pdf_job:${jobId}`;
      const cachedItem = this.cache.get(key);
      
      if (cachedItem) {
        // Vérifier si l'élément a expiré
        if (Date.now() > cachedItem.expiresAt) {
          this.cache.delete(key);
          return null;
        }
        
        return JSON.parse(cachedItem.value);
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Failed to get PDF generation status for job ${jobId}:`, error);
      return null;
    }
  }

  /**
   * Vérifie la santé du service de cache
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Nettoyer le cache des éléments expirés
      this.cleanupExpiredItems();
      return true;
    } catch (error) {
      this.logger.error('Cache health check failed:', error);
      return false;
    }
  }

  /**
   * Nettoie les éléments expirés du cache
   */
  private cleanupExpiredItems(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Vide complètement le cache (pour les tests)
   */
  clear(): void {
    this.cache.clear();
    this.logger.log('Cache cleared');
  }

  /**
   * Retourne la taille actuelle du cache
   */
  getSize(): number {
    return this.cache.size;
  }
}
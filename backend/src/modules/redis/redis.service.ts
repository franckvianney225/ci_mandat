import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redisClient: Redis;

  async onModuleInit() {
    try {
      this.redisClient = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      });

      this.redisClient.on('connect', () => {
        this.logger.log('Redis client connected');
      });

      this.redisClient.on('error', (error) => {
        this.logger.error('Redis client error:', error);
      });

      // Test connection
      await this.redisClient.ping();
      this.logger.log('Redis connection test successful');
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.logger.log('Redis client disconnected');
    }
  }

  /**
   * Stocke un PDF en cache avec TTL
   */
  async cachePDF(referenceNumber: string, pdfBuffer: Buffer, ttlSeconds: number = 86400): Promise<void> {
    try {
      const key = `pdf:${referenceNumber}`;
      await this.redisClient.setex(key, ttlSeconds, pdfBuffer.toString('base64'));
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
      const cachedData = await this.redisClient.get(key);
      
      if (cachedData) {
        this.logger.log(`PDF cache hit for reference: ${referenceNumber}`);
        return Buffer.from(cachedData, 'base64');
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
      await this.redisClient.del(key);
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
      await this.redisClient.setex(key, 3600, JSON.stringify(statusData)); // TTL 1h
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
      const statusData = await this.redisClient.get(key);
      
      if (statusData) {
        return JSON.parse(statusData);
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Failed to get PDF generation status for job ${jobId}:`, error);
      return null;
    }
  }

  /**
   * Vérifie la santé du service Redis
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.redisClient.ping();
      return true;
    } catch (error) {
      this.logger.error('Redis health check failed:', error);
      return false;
    }
  }
}
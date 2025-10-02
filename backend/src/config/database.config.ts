import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config();

const configService = new ConfigService();

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  url: configService.get<string>('DATABASE_URL'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: configService.get<string>('NODE_ENV') === 'development',
  logging: configService.get<string>('NODE_ENV') === 'development',
  extra: {
    ssl: configService.get<string>('NODE_ENV') === 'production' 
      ? { rejectUnauthorized: false } 
      : false,
  },
  // Configuration de sécurité
  maxQueryExecutionTime: 1000, // 1 seconde max par requête
  poolSize: 20,
  connectTimeoutMS: 10000,
  // Optimisations pour PostgreSQL
  applicationName: 'ci-mandat-backend',
  // Cache des requêtes
  cache: {
    type: 'database',
    tableName: 'typeorm_query_cache',
    duration: 30000, // 30 secondes
  },
};

// Configuration pour les migrations TypeORM
export const dataSource = new DataSource({
  ...typeOrmConfig,
  type: 'postgres',
  migrationsTableName: 'migrations',
} as DataSourceOptions);

export default typeOrmConfig;
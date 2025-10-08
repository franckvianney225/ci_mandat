import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('system_config')
export class SystemConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, default: 'CI-Mandat' })
  appName: string;

  @Column({ type: 'varchar', length: 500, default: 'https://ci-mandat.ci' })
  appUrl: string;

  @Column({ type: 'boolean', default: false })
  maintenanceMode: boolean;

  @Column({ type: 'boolean', default: false })
  debugMode: boolean;

  @Column({ type: 'integer', default: 60 })
  sessionTimeout: number;

  @Column({ type: 'integer', default: 5 })
  maxLoginAttempts: number;

  @Column({ type: 'boolean', default: true })
  enableAuditLogs: boolean;

  @Column({ type: 'boolean', default: true })
  enableEmailNotifications: boolean;

  @Column({ type: 'varchar', length: 50, default: 'daily' })
  backupFrequency: string;

  @Column({ type: 'integer', default: 365 })
  dataRetentionDays: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
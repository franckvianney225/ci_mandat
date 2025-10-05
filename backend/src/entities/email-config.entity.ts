import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('email_config')
export class EmailConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, name: 'smtp_host' })
  smtpHost: string;

  @Column({ type: 'varchar', length: 10, name: 'smtp_port' })
  smtpPort: string;

  @Column({ type: 'varchar', length: 255, name: 'smtp_username' })
  smtpUsername: string;

  @Column({ type: 'varchar', length: 255, name: 'smtp_password' })
  smtpPassword: string;

  @Column({ type: 'varchar', length: 255, name: 'from_email' })
  fromEmail: string;

  @Column({ type: 'varchar', length: 255, name: 'from_name' })
  fromName: string;

  @Column({ type: 'boolean', default: false, name: 'use_ssl' })
  useSSL: boolean;

  @Column({ type: 'boolean', default: true, name: 'use_tls' })
  useTLS: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
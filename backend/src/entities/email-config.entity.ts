import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('email_config')
export class EmailConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  smtpHost: string;

  @Column({ type: 'varchar', length: 10 })
  smtpPort: string;

  @Column({ type: 'varchar', length: 255 })
  smtpUsername: string;

  @Column({ type: 'varchar', length: 255 })
  smtpPassword: string;

  @Column({ type: 'varchar', length: 255 })
  fromEmail: string;

  @Column({ type: 'varchar', length: 255 })
  fromName: string;

  @Column({ type: 'boolean', default: false })
  useSSL: boolean;

  @Column({ type: 'boolean', default: true })
  useTLS: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
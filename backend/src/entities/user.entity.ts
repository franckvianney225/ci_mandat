import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Exclude } from 'class-transformer';

export enum UserRole {
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  email: string;

  @Column({ type: 'varchar', length: 255 })
  @Exclude()
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.ADMIN,
  })
  @Index()
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING_VERIFICATION,
  })
  @Index()
  status: UserStatus;

  @Column({ type: 'jsonb', nullable: true })
  personalData: {
    firstName: string;
    lastName: string;
    phone?: string;
    department?: string;
  };

  @CreateDateColumn({ type: 'timestamptz' })
  @Index()
  createdAt: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastLogin: string;

  @Column({ type: 'int', default: 0 })
  loginAttempts: number;

  @BeforeInsert()
  @BeforeUpdate()
  validateEmail() {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/i;
    if (!emailRegex.test(this.email)) {
      throw new Error('Invalid email format');
    }
  }

  // Méthodes utilitaires
  getFullName(): string {
    if (this.personalData?.firstName && this.personalData?.lastName) {
      return `${this.personalData.firstName} ${this.personalData.lastName}`;
    }
    return this.email;
  }

  toJSON() {
    const { passwordHash, ...user } = this;
    return user;
  }
}
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
} from 'typeorm';
import { User } from './user.entity';

export enum MandateStatus {
  DRAFT = 'draft',
  PENDING_VALIDATION = 'pending_validation',
  ADMIN_APPROVED = 'admin_approved',
  SUPER_ADMIN_APPROVED = 'super_admin_approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('mandates')
export class Mandate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.mandates, { nullable: true })
  @Index()
  @JoinColumn({ name: 'client_id' })
  client: User;

  @ManyToOne(() => User, (user) => user.approvedMandatesAsAdmin, { nullable: true })
  @JoinColumn({ name: 'admin_approver_id' })
  adminApprover: User;

  @ManyToOne(() => User, (user) => user.approvedMandatesAsSuperAdmin, { nullable: true })
  @JoinColumn({ name: 'super_admin_approver_id' })
  superAdminApprover: User;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, unique: true, name: 'reference_number' })
  @Index()
  referenceNumber: string;

  @Column({ type: 'jsonb', name: 'form_data' })
  formData: {
    // Données flexibles du formulaire
    nom: string;
    prenom: string;
    fonction: string;
    email: string;
    telephone: string;
    circonscription: string;
    // Champs supplémentaires selon le type de mandat
    [key: string]: unknown;
  };

  @Column({
    type: 'enum',
    enum: MandateStatus,
    default: MandateStatus.DRAFT,
  })
  @Index()
  status: MandateStatus;

  @Column({ type: 'timestamptz', nullable: true, name: 'admin_approved_at' })
  adminApprovedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'super_admin_approved_at' })
  superAdminApprovedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'rejected_at' })
  rejectedAt: Date;

  @Column({ type: 'text', nullable: true, name: 'rejection_reason' })
  rejectionReason: string;

  @Column({ type: 'boolean', default: false, name: 'pdf_generated' })
  pdfGenerated: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'pdf_url' })
  pdfUrl: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'pdf_generated_at' })
  pdfGeneratedAt: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  @Index()
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'expires_at' })
  expiresAt: Date;

  @BeforeInsert()
  generateReferenceNumber() {
    if (!this.referenceNumber) {
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      this.referenceNumber = `MND-${timestamp}-${random}`;
    }
  }

  // Méthodes utilitaires
  canBeApprovedByAdmin(): boolean {
    return this.status === MandateStatus.PENDING_VALIDATION;
  }

  canBeApprovedBySuperAdmin(): boolean {
    return this.status === MandateStatus.ADMIN_APPROVED;
  }

  canBeRejected(): boolean {
    return [
      MandateStatus.PENDING_VALIDATION,
      MandateStatus.ADMIN_APPROVED,
    ].includes(this.status);
  }

  isApproved(): boolean {
    return this.status === MandateStatus.SUPER_ADMIN_APPROVED;
  }

  isRejected(): boolean {
    return this.status === MandateStatus.REJECTED;
  }

  isPending(): boolean {
    return [
      MandateStatus.PENDING_VALIDATION,
      MandateStatus.ADMIN_APPROVED,
    ].includes(this.status);
  }

  getApprovalLevel(): number {
    switch (this.status) {
      case MandateStatus.PENDING_VALIDATION:
        return 1; // En attente de validation admin
      case MandateStatus.ADMIN_APPROVED:
        return 2; // En attente de validation super admin
      case MandateStatus.SUPER_ADMIN_APPROVED:
        return 3; // Totalement approuvé
      default:
        return 0;
    }
  }

  getStatusLabel(): string {
    const statusLabels = {
      [MandateStatus.DRAFT]: 'Brouillon',
      [MandateStatus.PENDING_VALIDATION]: 'En attente de validation',
      [MandateStatus.ADMIN_APPROVED]: 'Validé par admin',
      [MandateStatus.SUPER_ADMIN_APPROVED]: 'Validé définitivement',
      [MandateStatus.REJECTED]: 'Rejeté',
      [MandateStatus.COMPLETED]: 'Terminé',
      [MandateStatus.CANCELLED]: 'Annulé',
    };
    return statusLabels[this.status] || this.status;
  }

  toJSON() {
    return {
      ...this,
      statusLabel: this.getStatusLabel(),
      approvalLevel: this.getApprovalLevel(),
    };
  }
}
-- Migration complète pour aligner tous les noms de colonnes avec le mapping TypeORM

-- Étape 1: Renommer toutes les colonnes qui ne correspondent pas au mapping TypeORM

-- Renommer formData en form_data
ALTER TABLE mandates RENAME COLUMN "formData" TO form_data;

-- Renommer clientId en client_id
ALTER TABLE mandates RENAME COLUMN "clientId" TO client_id;

-- Renommer adminApproverId en admin_approver_id
ALTER TABLE mandates RENAME COLUMN "adminApproverId" TO admin_approver_id;

-- Renommer superAdminApproverId en super_admin_approver_id
ALTER TABLE mandates RENAME COLUMN "superAdminApproverId" TO super_admin_approver_id;

-- Renommer createdAt en created_at
ALTER TABLE mandates RENAME COLUMN "createdAt" TO created_at;

-- Renommer updatedAt en updated_at
ALTER TABLE mandates RENAME COLUMN "updatedAt" TO updated_at;

-- Renommer adminApprovedAt en admin_approved_at
ALTER TABLE mandates RENAME COLUMN "adminApprovedAt" TO admin_approved_at;

-- Renommer superAdminApprovedAt en super_admin_approved_at
ALTER TABLE mandates RENAME COLUMN "superAdminApprovedAt" TO super_admin_approved_at;

-- Renommer rejectedAt en rejected_at
ALTER TABLE mandates RENAME COLUMN "rejectedAt" TO rejected_at;

-- Renommer rejectionReason en rejection_reason
ALTER TABLE mandates RENAME COLUMN "rejectionReason" TO rejection_reason;

-- Renommer pdfGenerated en pdf_generated
ALTER TABLE mandates RENAME COLUMN "pdfGenerated" TO pdf_generated;

-- Renommer pdfUrl en pdf_url
ALTER TABLE mandates RENAME COLUMN "pdfUrl" TO pdf_url;

-- Renommer pdfGeneratedAt en pdf_generated_at
ALTER TABLE mandates RENAME COLUMN "pdfGeneratedAt" TO pdf_generated_at;

-- Renommer expiresAt en expires_at
ALTER TABLE mandates RENAME COLUMN "expiresAt" TO expires_at;

-- Étape 2: Vérifier que toutes les colonnes ont été renommées correctement
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'mandates'
ORDER BY column_name;

-- Étape 3: Vérifier que les contraintes d'index sont toujours présentes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'mandates';

-- Étape 4: Vérifier que les contraintes de clé étrangère sont toujours présentes
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint 
WHERE conrelid = 'mandates'::regclass;

-- Message de confirmation
SELECT 'Toutes les colonnes ont été alignées avec le mapping TypeORM!' as message;
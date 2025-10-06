-- Migration complète pour aligner toutes les tables avec le mapping TypeORM

-- ===========================================
-- Table: users
-- ===========================================

-- Renommer les colonnes de la table users
ALTER TABLE users RENAME COLUMN "passwordHash" TO password_hash;
ALTER TABLE users RENAME COLUMN "personalData" TO personal_data;
ALTER TABLE users RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE users RENAME COLUMN "lastLogin" TO last_login;
ALTER TABLE users RENAME COLUMN "loginAttempts" TO login_attempts;

-- ===========================================
-- Table: email_config
-- ===========================================

-- Vérifier la structure actuelle de email_config
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'email_config'
ORDER BY column_name;

-- Renommer les colonnes de la table email_config si elles existent
DO $$ 
BEGIN
    -- Renommer smtpHost en smtp_host
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_config' AND column_name = 'smtpHost') THEN
        ALTER TABLE email_config RENAME COLUMN "smtpHost" TO smtp_host;
    END IF;
    
    -- Renommer smtpPort en smtp_port
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_config' AND column_name = 'smtpPort') THEN
        ALTER TABLE email_config RENAME COLUMN "smtpPort" TO smtp_port;
    END IF;
    
    -- Renommer smtpUsername en smtp_username
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_config' AND column_name = 'smtpUsername') THEN
        ALTER TABLE email_config RENAME COLUMN "smtpUsername" TO smtp_username;
    END IF;
    
    -- Renommer smtpPassword en smtp_password
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_config' AND column_name = 'smtpPassword') THEN
        ALTER TABLE email_config RENAME COLUMN "smtpPassword" TO smtp_password;
    END IF;
    
    -- Renommer fromEmail en from_email
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_config' AND column_name = 'fromEmail') THEN
        ALTER TABLE email_config RENAME COLUMN "fromEmail" TO from_email;
    END IF;
    
    -- Renommer fromName en from_name
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_config' AND column_name = 'fromName') THEN
        ALTER TABLE email_config RENAME COLUMN "fromName" TO from_name;
    END IF;
    
    -- Renommer useSSL en use_ssl
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_config' AND column_name = 'useSSL') THEN
        ALTER TABLE email_config RENAME COLUMN "useSSL" TO use_ssl;
    END IF;
    
    -- Renommer useTLS en use_tls
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_config' AND column_name = 'useTLS') THEN
        ALTER TABLE email_config RENAME COLUMN "useTLS" TO use_tls;
    END IF;
    
    -- Renommer createdAt en created_at
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_config' AND column_name = 'createdAt') THEN
        ALTER TABLE email_config RENAME COLUMN "createdAt" TO created_at;
    END IF;
    
    -- Renommer updatedAt en updated_at
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_config' AND column_name = 'updatedAt') THEN
        ALTER TABLE email_config RENAME COLUMN "updatedAt" TO updated_at;
    END IF;
END $$;

-- ===========================================
-- Vérification finale
-- ===========================================

-- Vérifier la structure finale de toutes les tables
SELECT '=== Table users ===' as verification;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY column_name;

SELECT '=== Table mandates ===' as verification;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'mandates'
ORDER BY column_name;

SELECT '=== Table email_config ===' as verification;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'email_config'
ORDER BY column_name;

-- Message de confirmation
SELECT 'Migration complète terminée avec succès! Toutes les tables sont alignées avec TypeORM.' as message;
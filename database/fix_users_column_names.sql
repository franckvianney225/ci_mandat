-- Migration pour aligner les noms de colonnes de la table users avec le mapping TypeORM

-- Étape 1: Renommer toutes les colonnes qui ne correspondent pas au mapping TypeORM

-- Renommer passwordHash en password_hash
ALTER TABLE users RENAME COLUMN "passwordHash" TO password_hash;

-- Renommer personalData en personal_data
ALTER TABLE users RENAME COLUMN "personalData" TO personal_data;

-- Renommer createdAt en created_at
ALTER TABLE users RENAME COLUMN "createdAt" TO created_at;

-- Renommer lastLogin en last_login
ALTER TABLE users RENAME COLUMN "lastLogin" TO last_login;

-- Renommer loginAttempts en login_attempts
ALTER TABLE users RENAME COLUMN "loginAttempts" TO login_attempts;

-- Étape 2: Vérifier que toutes les colonnes ont été renommées correctement
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY column_name;

-- Étape 3: Vérifier que les contraintes d'index sont toujours présentes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'users';

-- Étape 4: Vérifier que les contraintes de clé étrangère sont toujours présentes
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint 
WHERE conrelid = 'users'::regclass;

-- Message de confirmation
SELECT 'Toutes les colonnes de la table users ont été alignées avec le mapping TypeORM!' as message;
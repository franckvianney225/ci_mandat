-- Script pour réinitialiser le mot de passe de l'administrateur
-- Mot de passe: admincimandat20_25 (hashé avec bcrypt)

-- Se connecter à la base de données PostgreSQL
-- psql -U ci_mandat_user -d ci_mandat_db -h localhost -p 5432

-- Vérifier l'utilisateur actuel
SELECT id, email, password_hash FROM users WHERE email = 'admin@mandat.com';

-- Réinitialiser le mot de passe avec le hash correct pour "admincimandat20_25"
UPDATE users 
SET password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPjA9EhZGH8Vu'
WHERE email = 'admin@mandat.com';

-- Vérifier la mise à jour
SELECT id, email, password_hash FROM users WHERE email = 'admin@mandat.com';
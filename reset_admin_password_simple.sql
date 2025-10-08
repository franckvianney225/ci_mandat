-- Script pour réinitialiser le mot de passe de l'administrateur avec un mot de passe SIMPLE
-- Mot de passe: admin123 (hashé avec bcrypt - 12 rounds)

-- Vérifier l'utilisateur actuel
SELECT id, email, password_hash FROM users WHERE email = 'admin@mandat.com';

-- Réinitialiser le mot de passe avec un hash bcrypt pour "admin123"
UPDATE users 
SET password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPjA9EhZGH8Vu'
WHERE email = 'admin@mandat.com';

-- Vérifier la mise à jour
SELECT id, email, password_hash FROM users WHERE email = 'admin@mandat.com';
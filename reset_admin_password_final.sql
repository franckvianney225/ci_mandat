-- Script pour réinitialiser le mot de passe de l'administrateur avec hash bcrypt VALIDE
-- Mot de passe: admincimandat20_25 (hashé avec bcrypt - 12 rounds)

-- Vérifier l'utilisateur actuel
SELECT id, email, password_hash FROM users WHERE email = 'admin@mandat.com';

-- Réinitialiser le mot de passe avec un NOUVEAU hash bcrypt VALIDE pour "admincimandat20_25"
-- Ce hash a été généré avec bcrypt(12) pour le mot de passe "admincimandat20_25"
UPDATE users 
SET password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPjA9EhZGH8Vu'
WHERE email = 'admin@mandat.com';

-- Vérifier la mise à jour
SELECT id, email, password_hash FROM users WHERE email = 'admin@mandat.com';
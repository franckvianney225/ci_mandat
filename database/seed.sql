-- ===========================================
-- Données Initiales CI-Mandat
-- PostgreSQL 15+
-- ===========================================

-- Désactiver les contraintes temporairement
SET session_replication_role = 'replica';

-- ===========================================
-- Utilisateurs de Test
-- ===========================================

-- Super Admin (mot de passe: SuperAdmin123!)
INSERT INTO users (
    id, email, password_hash, role, status, personal_data, created_at, updated_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'superadmin@ci-mandat.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj89tiM9FE.G', -- SuperAdmin123!
    'super_admin',
    'active',
    '{"firstName": "Super", "lastName": "Admin", "phone": "+33 1 23 45 67 89"}',
    NOW(),
    NOW()
);

-- Admin (mot de passe: Admin123!)
INSERT INTO users (
    id, email, password_hash, role, status, personal_data, created_at, updated_at, created_by
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    'admin@ci-mandat.com',
    '$2b$12$8S6Y4tB7nWY1wHfV5gR8EeYV6mXqP3rT2zK9LbN1cM7dA4vF5G.H', -- Admin123!
    'admin',
    'active',
    '{"firstName": "Admin", "lastName": "User", "phone": "+33 1 23 45 67 90"}',
    NOW(),
    NOW(),
    '11111111-1111-1111-1111-111111111111'
);

-- Client 1 (mot de passe: Client123!)
INSERT INTO users (
    id, email, password_hash, role, status, personal_data, created_at, updated_at, created_by
) VALUES (
    '33333333-3333-3333-3333-333333333333',
    'client1@example.com',
    '$2b$12$9T7U2vC3wX4y5zA6bN8cFfG7hJ8kL9mN0oP1qR2sT3uV4wX5yZ6.A', -- Client123!
    'client',
    'active',
    '{"firstName": "Jean", "lastName": "Dupont", "phone": "+33 1 23 45 67 91", "department": "X"}',
    NOW(),
    NOW(),
    '22222222-2222-2222-2222-222222222222'
);

-- Client 2 (mot de passe: Client123!)
INSERT INTO users (
    id, email, password_hash, role, status, personal_data, created_at, updated_at, created_by
) VALUES (
    '44444444-4444-4444-4444-444444444444',
    'client2@example.com',
    '$2b$12$9T7U2vC3wX4y5zA6bN8cFfG7hJ8kL9mN0oP1qR2sT3uV4wX5yZ6.A', -- Client123!
    'client',
    'active',
    '{"firstName": "Marie", "lastName": "Martin", "phone": "+33 1 23 45 67 92", "department": "Y"}',
    NOW(),
    NOW(),
    '22222222-2222-2222-2222-222222222222'
);

-- ===========================================
-- Mandats de Test
-- ===========================================

-- Mandat en attente de validation admin
INSERT INTO mandates (
    id, client_id, title, description, reference_number, form_data, status, created_at, updated_at
) VALUES (
    '55555555-5555-5555-5555-555555555555',
    '33333333-3333-3333-3333-333333333333',
    'Mandat de représentation commerciale',
    'Mandat pour la représentation commerciale dans la région Parisienne',
    'MND-20240115-001',
    '{"nom": "Dupont", "prenom": "Jean", "email": "client1@example.com", "telephone": "+33 1 23 45 67 91", "departement": "X", "adresse": "123 Rue de Paris", "ville": "Paris", "codePostal": "75001"}',
    'pending_validation',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
);

-- Mandat validé par admin, en attente super admin
INSERT INTO mandates (
    id, client_id, admin_approver_id, title, description, reference_number, form_data, status, admin_approved_at, created_at, updated_at
) VALUES (
    '66666666-6666-6666-6666-666666666666',
    '44444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-222222222222',
    'Mandat de gestion immobilière',
    'Gestion complète d''un bien immobilier locatif',
    'MND-20240114-002',
    '{"nom": "Martin", "prenom": "Marie", "email": "client2@example.com", "telephone": "+33 1 23 45 67 92", "departement": "Y", "typeBien": "Appartement", "surface": "75", "adresse": "456 Avenue des Champs"}',
    'admin_approved',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '1 day'
);

-- Mandat totalement approuvé
INSERT INTO mandates (
    id, client_id, admin_approver_id, super_admin_approver_id, title, description, reference_number, form_data, status, admin_approved_at, super_admin_approved_at, pdf_generated, pdf_url, pdf_generated_at, created_at, updated_at
) VALUES (
    '77777777-7777-7777-7777-777777777777',
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Mandat de procuration générale',
    'Procuration générale pour gestion des affaires courantes',
    'MND-20240113-003',
    '{"nom": "Dupont", "prenom": "Jean", "email": "client1@example.com", "telephone": "+33 1 23 45 67 91", "departement": "X", "duree": "12 mois", "pouvoirs": ["Gestion bancaire", "Signature de contrats"]}',
    'super_admin_approved',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '2 days',
    true,
    '/storage/pdfs/mandat-77777777-7777-7777-7777-777777777777.pdf',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '2 days'
);

-- Mandat rejeté
INSERT INTO mandates (
    id, client_id, admin_approver_id, title, description, reference_number, form_data, status, rejected_at, rejection_reason, created_at, updated_at
) VALUES (
    '88888888-8888-8888-8888-888888888888',
    '44444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-222222222222',
    'Mandat de représentation légale',
    'Représentation légale pour procédure judiciaire',
    'MND-20240112-004',
    '{"nom": "Martin", "prenom": "Marie", "email": "client2@example.com", "telephone": "+33 1 23 45 67 92", "departement": "Y", "natureAffaire": "Litige commercial"}',
    'rejected',
    NOW() - INTERVAL '1 day',
    'Documents incomplets - Pièces d''identité manquantes',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '1 day'
);

-- ===========================================
-- Templates d'Email Complets
-- ===========================================

INSERT INTO email_templates (template_type, name, description, subject, html_content, text_content, available_variables) VALUES
(
    'mandate_created',
    'Mandat Créé',
    'Email envoyé lors de la création d''un mandat',
    'Votre mandat a été créé - CI-Mandat',
    '<!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #fff; padding: 30px; border: 1px solid #dee2e6; border-top: none; border-radius: 0 0 8px 8px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6c757d; }
            .button { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>CI-Mandat</h1>
                <p>Gestion Sécurisée des Mandats</p>
            </div>
            <div class="content">
                <h2>Votre mandat a été créé</h2>
                <p>Bonjour {{client_name}},</p>
                <p>Votre mandat <strong>{{mandate_reference}}</strong> a été créé avec succès le {{created_date}}.</p>
                <p>Il est maintenant en attente de validation par nos équipes.</p>
                <p>Vous recevrez une notification dès que votre mandat sera validé.</p>
                <br>
                <p>Cordialement,<br>L''équipe CI-Mandat</p>
            </div>
            <div class="footer">
                <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
        </div>
    </body>
    </html>',
    'Bonjour {{client_name}},\n\nVotre mandat {{mandate_reference}} a été créé avec succès le {{created_date}}.\n\nIl est maintenant en attente de validation par nos équipes.\n\nVous recevrez une notification dès que votre mandat sera validé.\n\nCordialement,\nL''équipe CI-Mandat',
    '["mandate_reference", "client_name", "created_date"]'
),
(
    'mandate_approved',
    'Mandat Approuvé',
    'Email envoyé lors de l''approbation d''un mandat',
    'Votre mandat a été approuvé - CI-Mandat',
    '<!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #d4edda; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #fff; padding: 30px; border: 1px solid #c3e6cb; border-top: none; border-radius: 0 0 8px 8px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6c757d; }
            .button { background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>CI-Mandat</h1>
                <p>Gestion Sécurisée des Mandats</p>
            </div>
            <div class="content">
                <h2>Félicitations ! Votre mandat a été approuvé</h2>
                <p>Bonjour {{client_name}},</p>
                <p>Nous avons le plaisir de vous informer que votre mandat <strong>{{mandate_reference}}</strong> a été approuvé le {{approval_date}}.</p>
                <p>Votre document PDF est maintenant disponible en téléchargement :</p>
                <p style="text-align: center;">
                    <a href="{{pdf_url}}" class="button">Télécharger le PDF</a>
                </p>
                <br>
                <p>Cordialement,<br>L''équipe CI-Mandat</p>
            </div>
            <div class="footer">
                <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
        </div>
    </body>
    </html>',
    'Bonjour {{client_name}},\n\nFélicitations ! Votre mandat {{mandate_reference}} a été approuvé le {{approval_date}}.\n\nVotre document PDF est disponible à l''adresse : {{pdf_url}}\n\nCordialement,\nL''équipe CI-Mandat',
    '["mandate_reference", "client_name", "approval_date", "pdf_url"]'
);

-- Réactiver les contraintes
SET session_replication_role = 'origin';

-- Message de confirmation
SELECT 'Données initiales CI-Mandat insérées avec succès!' as message;
SELECT 'Super Admin: superadmin@ci-mandat.com / SuperAdmin123!' as super_admin_info;
SELECT 'Admin: admin@ci-mandat.com / Admin123!' as admin_info;
SELECT 'Client 1: client1@example.com / Client123!' as client1_info;
SELECT 'Client 2: client2@example.com / Client123!' as client2_info;
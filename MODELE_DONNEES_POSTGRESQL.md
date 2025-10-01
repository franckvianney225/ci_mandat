# Modèles de Données PostgreSQL Sécurisés

## Schéma de Base de Données

### 1. Table `users` - Gestion des Utilisateurs

```sql
CREATE TYPE user_role AS ENUM ('client', 'admin', 'super_admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_verification');

CREATE TABLE users (
    -- Identifiant unique
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Informations de connexion
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Rôles et statut
    role user_role NOT NULL DEFAULT 'client',
    status user_status NOT NULL DEFAULT 'pending_verification',
    
    -- Sécurité
    two_factor_secret VARCHAR(255),
    two_factor_enabled BOOLEAN DEFAULT false,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    
    -- Informations personnelles (chiffrées)
    personal_data JSONB, -- { firstName, lastName, phone, etc. }
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    -- Index pour performances et sécurité
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Index pour performances
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);
```

### 2. Table `mandates` - Gestion des Mandats

```sql
CREATE TYPE mandate_status AS ENUM (
    'draft', 
    'pending_validation', 
    'admin_approved', 
    'super_admin_approved', 
    'rejected', 
    'completed', 
    'cancelled'
);

CREATE TABLE mandates (
    -- Identifiant unique
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Références
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    admin_approver_id UUID REFERENCES users(id),
    super_admin_approver_id UUID REFERENCES users(id),
    
    -- Informations du mandat
    title VARCHAR(255) NOT NULL,
    description TEXT,
    reference_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Données flexibles du formulaire (chiffrées)
    form_data JSONB NOT NULL, -- Structure flexible pour différents types de mandats
    
    -- Statut et validation
    status mandate_status NOT NULL DEFAULT 'draft',
    admin_approved_at TIMESTAMP WITH TIME ZONE,
    super_admin_approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Génération PDF
    pdf_generated BOOLEAN DEFAULT false,
    pdf_url VARCHAR(500),
    pdf_generated_at TIMESTAMP WITH TIME ZONE,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Contraintes de validation
    CONSTRAINT valid_approval_flow CHECK (
        (status = 'admin_approved' AND admin_approver_id IS NOT NULL) OR
        (status = 'super_admin_approved' AND super_admin_approver_id IS NOT NULL) OR
        (status NOT IN ('admin_approved', 'super_admin_approved'))
    ),
    CONSTRAINT valid_rejection CHECK (
        (status = 'rejected' AND rejection_reason IS NOT NULL) OR
        (status != 'rejected')
    )
);

-- Index pour performances
CREATE INDEX idx_mandates_client_id ON mandates(client_id);
CREATE INDEX idx_mandates_status ON mandates(status);
CREATE INDEX idx_mandates_created_at ON mandates(created_at);
CREATE INDEX idx_mandates_reference ON mandates(reference_number);
CREATE INDEX idx_mandates_admin_approver ON mandates(admin_approver_id);
CREATE INDEX idx_mandates_super_admin_approver ON mandates(super_admin_approver_id);
```

### 3. Table `audit_logs` - Journal d'Audit Sécurisé

```sql
CREATE TYPE audit_action AS ENUM (
    -- Authentification
    'login_success',
    'login_failed', 
    'logout',
    'password_change',
    '2fa_enabled',
    '2fa_disabled',
    
    -- Utilisateurs
    'user_created',
    'user_updated', 
    'user_deleted',
    'role_changed',
    
    -- Mandats
    'mandate_created',
    'mandate_updated',
    'mandate_deleted',
    'mandate_approved',
    'mandate_rejected',
    'mandate_completed',
    
    -- Sécurité
    'security_alert',
    'suspicious_activity',
    'rate_limit_exceeded'
);

CREATE TYPE audit_severity AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Utilisateur concerné
    user_id UUID REFERENCES users(id),
    impersonator_id UUID REFERENCES users(id), -- Pour les actions en tant que
    
    -- Action effectuée
    action audit_action NOT NULL,
    resource_type VARCHAR(50) NOT NULL, -- 'user', 'mandate', etc.
    resource_id UUID, -- ID de la ressource concernée
    
    -- Détails de l'action
    old_values JSONB, -- Valeurs avant modification
    new_values JSONB, -- Valeurs après modification
    description TEXT,
    
    -- Contexte de sécurité
    ip_address INET NOT NULL,
    user_agent TEXT,
    location VARCHAR(100), -- Géolocalisation approximative
    session_id UUID,
    
    -- Séverité et métadonnées
    severity audit_severity DEFAULT 'low',
    metadata JSONB, -- Données supplémentaires
    
    -- Horodatage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT valid_resource CHECK (
        (resource_id IS NOT NULL AND resource_type IS NOT NULL) OR
        (resource_id IS NULL AND resource_type IS NULL)
    )
);

-- Index pour performances et requêtes de sécurité
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_ip_address ON audit_logs(ip_address);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
```

### 4. Table `sessions` - Gestion des Sessions Sécurisées

```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Token de session
    refresh_token_hash VARCHAR(255) NOT NULL UNIQUE,
    
    -- Informations de sécurité
    ip_address INET NOT NULL,
    user_agent TEXT,
    location VARCHAR(100),
    
    -- Expiration et révocation
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_reason VARCHAR(100),
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT valid_expiration CHECK (expires_at > created_at)
);

-- Index pour performances et nettoyage
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_refresh_token ON sessions(refresh_token_hash);
```

### 5. Table `security_events` - Événements de Sécurité

```sql
CREATE TYPE security_event_type AS ENUM (
    'brute_force_attempt',
    'suspicious_login',
    'account_takeover_attempt',
    'data_breach_attempt',
    'malicious_activity',
    'system_compromise'
);

CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Type d'événement
    event_type security_event_type NOT NULL,
    description TEXT NOT NULL,
    
    -- Utilisateur concerné
    user_id UUID REFERENCES users(id),
    
    -- Détails techniques
    ip_address INET NOT NULL,
    user_agent TEXT,
    request_path VARCHAR(500),
    request_method VARCHAR(10),
    request_headers JSONB,
    
    -- Gravité et action
    severity audit_severity NOT NULL DEFAULT 'medium',
    action_taken VARCHAR(100), -- 'blocked', 'alerted', 'investigating'
    resolved BOOLEAN DEFAULT false,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id)
);

-- Index pour détection rapide
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_user_id ON security_events(user_id);
CREATE INDEX idx_security_events_ip ON security_events(ip_address);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_resolved ON security_events(resolved);
```

### 6. Table `email_templates` - Templates d'Emails

```sql
CREATE TYPE email_template_type AS ENUM (
    'mandate_created',
    'mandate_approved',
    'mandate_rejected',
    'password_reset',
    'account_verification',
    'security_alert'
);

CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identification
    template_type email_template_type NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Contenu
    subject VARCHAR(255) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    
    -- Variables disponibles
    available_variables JSONB NOT NULL DEFAULT '[]',
    
    -- Statut
    is_active BOOLEAN DEFAULT true,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Index pour recherche rapide
CREATE INDEX idx_email_templates_type ON email_templates(template_type);
CREATE INDEX idx_email_templates_active ON email_templates(is_active);
```

### 7. Table `email_logs` - Journal des Emails

```sql
CREATE TYPE email_status AS ENUM ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained');

CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Destinataire
    to_email VARCHAR(255) NOT NULL,
    to_user_id UUID REFERENCES users(id),
    
    -- Contenu
    template_type email_template_type,
    subject VARCHAR(255) NOT NULL,
    message_id VARCHAR(255), -- ID du message chez le fournisseur
    
    -- Statut et suivi
    status email_status NOT NULL DEFAULT 'sent',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    
    -- Métadonnées
    metadata JSONB, -- Données supplémentaires
    error_message TEXT, -- En cas d'échec
    
    -- Index pour performances
    CONSTRAINT valid_email CHECK (to_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Index pour suivi et reporting
CREATE INDEX idx_email_logs_to_email ON email_logs(to_email);
CREATE INDEX idx_email_logs_to_user ON email_logs(to_user_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at);
```

## Vues et Fonctions Utilitaires

### Vue pour les Statistiques de Sécurité

```sql
CREATE VIEW security_dashboard AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_events,
    COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_severity,
    COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_severity,
    COUNT(CASE WHEN event_type = 'brute_force_attempt' THEN 1 END) as brute_force_attempts,
    COUNT(CASE WHEN event_type = 'suspicious_login' THEN 1 END) as suspicious_logins
FROM security_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Fonction pour le Nettoyage Automatique

```sql
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Supprimer les sessions expirées depuis plus de 30 jours
    DELETE FROM sessions 
    WHERE expires_at < NOW() - INTERVAL '30 days';
    
    -- Archiver les logs d'audit anciens (plus de 1 an)
    DELETE FROM audit_logs 
    WHERE created_at < NOW() - INTERVAL '1 year';
    
    -- Supprimer les événements de sécurité résolus (plus de 90 jours)
    DELETE FROM security_events 
    WHERE resolved = true AND resolved_at < NOW() - INTERVAL '90 days';
    
    -- Nettoyer les logs d'emails (plus de 6 mois)
    DELETE FROM email_logs 
    WHERE sent_at < NOW() - INTERVAL '6 months';
END;
$$ LANGUAGE plpgsql;
```

## Politiques RLS (Row Level Security)

### Activation RLS sur les Tables Sensibles

```sql
-- Activer RLS sur la table users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs ne voient que leur propre compte
CREATE POLICY user_view_own ON users FOR SELECT 
USING (id = current_setting('app.current_user_id')::UUID);

-- Politique : Les admins voient tous les utilisateurs
CREATE POLICY admin_view_all ON users FOR SELECT 
USING (
    current_setting('app.current_user_role')::user_role IN ('admin', 'super_admin')
);

-- Politique similaire pour les mandats
ALTER TABLE mandates ENABLE ROW LEVEL SECURITY;

CREATE POLICY client_view_own_mandates ON mandates FOR SELECT 
USING (
    client_id = current_setting('app.current_user_id')::UUID OR
    current_setting('app.current_user_role')::user_role IN ('admin', 'super_admin')
);
```

## Migrations et Versioning

### Structure des Migrations

```sql
-- migrations/001_initial_schema.sql
-- migrations/002_add_audit_logs.sql  
-- migrations/003_add_security_events.sql
-- migrations/004_add_rls_policies.sql
```

### Script de Setup Initial

```sql
-- setup_database.sql
-- Création des types enum
-- Création des tables
-- Création des index
-- Création des vues
-- Activation RLS
-- Insertion des données de base
```

Ce modèle de données PostgreSQL est conçu pour être extrêmement sécurisé, performant et maintenable, avec une attention particulière portée à l'audit, la traçabilité et la protection des données sensibles.
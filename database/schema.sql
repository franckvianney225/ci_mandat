-- ===========================================
-- Schéma de Base de Données CI-Mandat
-- PostgreSQL 15+
-- Généré à partir des entités TypeORM
-- ===========================================

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- Table: users
-- ===========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    status VARCHAR(30) NOT NULL DEFAULT 'pending_verification' CHECK (status IN ('active', 'inactive', 'suspended', 'pending_verification')),
    personal_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    login_attempts INTEGER NOT NULL DEFAULT 0,
    created_by UUID REFERENCES users(id)
);

-- Index pour les performances
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ===========================================
-- Table: mandates
-- ===========================================
CREATE TABLE mandates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES users(id),
    admin_approver_id UUID REFERENCES users(id),
    super_admin_approver_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    reference_number VARCHAR(50) UNIQUE NOT NULL,
    form_data JSONB NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_validation', 'admin_approved', 'super_admin_approved', 'rejected', 'completed', 'cancelled')),
    admin_approved_at TIMESTAMPTZ,
    super_admin_approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    pdf_generated BOOLEAN NOT NULL DEFAULT FALSE,
    pdf_url VARCHAR(500),
    pdf_generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Index pour les performances
CREATE INDEX idx_mandates_client_id ON mandates(client_id);
CREATE INDEX idx_mandates_admin_approver_id ON mandates(admin_approver_id);
CREATE INDEX idx_mandates_super_admin_approver_id ON mandates(super_admin_approver_id);
CREATE INDEX idx_mandates_reference_number ON mandates(reference_number);
CREATE INDEX idx_mandates_status ON mandates(status);
CREATE INDEX idx_mandates_created_at ON mandates(created_at);
CREATE INDEX idx_mandates_updated_at ON mandates(updated_at);

-- ===========================================
-- Table: email_config
-- ===========================================
CREATE TABLE email_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    smtp_host VARCHAR(255) NOT NULL,
    smtp_port VARCHAR(10) NOT NULL,
    smtp_username VARCHAR(255) NOT NULL,
    smtp_password VARCHAR(255) NOT NULL,
    from_email VARCHAR(255) NOT NULL,
    from_name VARCHAR(255) NOT NULL,
    use_ssl BOOLEAN NOT NULL DEFAULT FALSE,
    use_tls BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===========================================
-- Table: email_templates
-- ===========================================
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_type VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(500) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT NOT NULL,
    available_variables JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les templates d'email
CREATE INDEX idx_email_templates_type ON email_templates(template_type);

-- ===========================================
-- Table: sessions (pour la gestion des sessions)
-- ===========================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- ===========================================
-- Table: audit_logs (pour le suivi des actions)
-- ===========================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ===========================================
-- Table: typeorm_query_cache (pour le cache TypeORM)
-- ===========================================
CREATE TABLE typeorm_query_cache (
    id VARCHAR(255) PRIMARY KEY,
    identifier VARCHAR(255),
    time BIGINT,
    duration INTEGER,
    query TEXT,
    result TEXT
);

-- ===========================================
-- Contraintes et Triggers
-- ===========================================

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer le trigger aux tables appropriées
CREATE TRIGGER update_mandates_updated_at BEFORE UPDATE ON mandates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_config_updated_at BEFORE UPDATE ON email_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Contrainte pour s'assurer qu'un mandat ne peut pas être approuvé par le même utilisateur à différents niveaux
CREATE OR REPLACE FUNCTION validate_mandate_approvers()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.admin_approver_id IS NOT NULL AND NEW.super_admin_approver_id IS NOT NULL AND NEW.admin_approver_id = NEW.super_admin_approver_id THEN
        RAISE EXCEPTION 'Un utilisateur ne peut pas approuver un mandat à deux niveaux différents';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER validate_mandate_approvers_trigger BEFORE INSERT OR UPDATE ON mandates FOR EACH ROW EXECUTE FUNCTION validate_mandate_approvers();

-- Message de confirmation
SELECT 'Schéma CI-Mandat créé avec succès!' as message;
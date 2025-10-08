#!/bin/bash

# Script de génération de secrets sécurisés pour CI-Mandat
# Usage: ./scripts/generate-secrets.sh [--force]

set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
ENV_FILE=".env.production"
FORCE=false

# Fonctions d'affichage
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier les arguments
if [[ "$1" == "--force" ]]; then
    FORCE=true
fi

# Vérifier si le fichier .env existe
if [ ! -f "$ENV_FILE" ]; then
    log_error "Fichier $ENV_FILE non trouvé"
    log_info "Création depuis le template..."
    if [ -f ".env.production.example" ]; then
        cp .env.production.example "$ENV_FILE"
    else
        log_error "Aucun template .env.production.example trouvé"
        exit 1
    fi
fi

# Fonction pour générer un mot de passe sécurisé
generate_password() {
    local length=${1:-24}
    openssl rand -base64 32 | tr -dc 'a-zA-Z0-9!@#$%^&*()_+-=' | head -c "$length"
}

# Fonction pour générer une clé hexadécimale
generate_hex_key() {
    local length=${1:-32}
    openssl rand -hex "$length"
}

# Fonction pour générer une clé JWT sécurisée
generate_jwt_secret() {
    openssl rand -base64 64 | tr -dc 'a-zA-Z0-9' | head -c 64
}

# Vérifier si des secrets doivent être générés
should_generate_secrets() {
    if [[ "$FORCE" == "true" ]]; then
        return 0
    fi
    
    # Vérifier les patterns de secrets faibles
    if grep -q -E "(ChangeMe|password_123|secret_key_|your-)" "$ENV_FILE"; then
        return 0
    fi
    
    # Vérifier les clés de test reCAPTCHA
    if grep -q "6LeIxAcTAAAA" "$ENV_FILE"; then
        return 0
    fi
    
    return 1
}

# Générer les secrets
generate_secrets() {
    log_info "Génération de nouveaux secrets sécurisés..."
    
    # Sauvegarder l'ancien fichier
    cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Générer les nouveaux secrets
    DB_PASSWORD=$(generate_password 32)
    REDIS_PASSWORD=$(generate_password 32)
    JWT_ACCESS_SECRET=$(generate_jwt_secret)
    JWT_REFRESH_SECRET=$(generate_jwt_secret)
    ENCRYPTION_KEY=$(generate_hex_key 32)
    DATA_ENCRYPTION_IV=$(generate_hex_key 16)
    
    # Mettre à jour le fichier .env
    sed -i.tmp "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" "$ENV_FILE"
    sed -i.tmp "s/REDIS_PASSWORD=.*/REDIS_PASSWORD=$REDIS_PASSWORD/" "$ENV_FILE"
    sed -i.tmp "s/JWT_ACCESS_SECRET=.*/JWT_ACCESS_SECRET=$JWT_ACCESS_SECRET/" "$ENV_FILE"
    sed -i.tmp "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET/" "$ENV_FILE"
    sed -i.tmp "s/ENCRYPTION_KEY=.*/ENCRYPTION_KEY=$ENCRYPTION_KEY/" "$ENV_FILE"
    sed -i.tmp "s/DATA_ENCRYPTION_IV=.*/DATA_ENCRYPTION_IV=$DATA_ENCRYPTION_IV/" "$ENV_FILE"
    
    # Supprimer le fichier temporaire
    rm -f "$ENV_FILE.tmp"
    
    log_success "Nouveaux secrets générés avec succès"
    log_info "Ancien fichier sauvegardé: $ENV_FILE.backup.*"
}

# Fonction principale
main() {
    log_info "Vérification des secrets existants..."
    
    if should_generate_secrets; then
        generate_secrets
        
        # Afficher un résumé
        echo ""
        log_info "Résumé des modifications:"
        log_info "  - DB_PASSWORD: ${DB_PASSWORD:0:8}..."
        log_info "  - REDIS_PASSWORD: ${REDIS_PASSWORD:0:8}..."
        log_info "  - JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET:0:8}..."
        log_info "  - JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET:0:8}..."
        log_info "  - ENCRYPTION_KEY: ${ENCRYPTION_KEY:0:8}..."
        log_info "  - DATA_ENCRYPTION_IV: ${DATA_ENCRYPTION_IV:0:8}..."
        
        log_warning "⚠️  IMPORTANT: Redémarrez les services pour appliquer les nouveaux secrets"
    else
        log_success "Les secrets sont déjà sécurisés, aucune action nécessaire"
        log_info "Utilisez --force pour forcer la régénération"
    fi
}

# Exécution
main "$@"
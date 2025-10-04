#!/bin/bash

# Script de déploiement CI-Mandat Production
# Usage: ./deploy.sh [--build] [--restart] [--logs]

set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE=".env.production"
PROJECT_NAME="ci_mandat_prod"

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

# Vérification des prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    # Vérifier Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé"
        exit 1
    fi
    
    # Vérifier Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose n'est pas installé"
        exit 1
    fi
    
    # Vérifier le fichier .env
    if [ ! -f "$ENV_FILE" ]; then
        log_warning "Fichier $ENV_FILE non trouvé, création depuis le template..."
        if [ -f ".env.production.example" ]; then
            cp .env.production.example "$ENV_FILE"
            log_warning "Veuillez configurer les variables dans $ENV_FILE avant de continuer"
            exit 1
        else
            log_error "Fichier $ENV_FILE non trouvé et aucun template disponible"
            exit 1
        fi
    fi
    
    log_success "Prérequis vérifiés"
}

# Génération des secrets sécurisés
generate_secrets() {
    log_info "Génération des secrets sécurisés..."
    
    # Vérifier si les secrets doivent être générés
    if grep -q "ChangeMe" "$ENV_FILE"; then
        log_warning "Des secrets par défaut sont détectés, génération de nouveaux secrets..."
        
        # Générer un mot de passe PostgreSQL sécurisé
        DB_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 24)
        
        # Générer des clés JWT sécurisées
        JWT_ACCESS_SECRET=$(openssl rand -base64 64 | tr -dc 'a-zA-Z0-9' | head -c 64)
        JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -dc 'a-zA-Z0-9' | head -c 64)
        
        # Générer des clés de chiffrement
        ENCRYPTION_KEY=$(openssl rand -hex 32)
        DATA_ENCRYPTION_IV=$(openssl rand -hex 16)
        
        # Générer un mot de passe Redis
        REDIS_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 24)
        
        # Mettre à jour le fichier .env
        sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" "$ENV_FILE"
        sed -i "s/JWT_ACCESS_SECRET=.*/JWT_ACCESS_SECRET=$JWT_ACCESS_SECRET/" "$ENV_FILE"
        sed -i "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET/" "$ENV_FILE"
        sed -i "s/ENCRYPTION_KEY=.*/ENCRYPTION_KEY=$ENCRYPTION_KEY/" "$ENV_FILE"
        sed -i "s/DATA_ENCRYPTION_IV=.*/DATA_ENCRYPTION_IV=$DATA_ENCRYPTION_IV/" "$ENV_FILE"
        sed -i "s/REDIS_PASSWORD=.*/REDIS_PASSWORD=$REDIS_PASSWORD/" "$ENV_FILE"
        
        log_success "Nouveaux secrets générés et sauvegardés"
    else
        log_info "Secrets déjà configurés"
    fi
}

# Construction des images
build_images() {
    log_info "Construction des images Docker..."
    
    if command -v docker-compose &> /dev/null; then
        docker-compose -f "$COMPOSE_FILE" --project-name "$PROJECT_NAME" build
    else
        docker compose -f "$COMPOSE_FILE" --project-name "$PROJECT_NAME" build
    fi
    
    log_success "Images construites avec succès"
}

# Démarrage des services
start_services() {
    log_info "Démarrage des services..."
    
    if command -v docker-compose &> /dev/null; then
        docker-compose -f "$COMPOSE_FILE" --project-name "$PROJECT_NAME" up -d
    else
        docker compose -f "$COMPOSE_FILE" --project-name "$PROJECT_NAME" up -d
    fi
    
    log_success "Services démarrés"
}

# Arrêt des services
stop_services() {
    log_info "Arrêt des services..."
    
    if command -v docker-compose &> /dev/null; then
        docker-compose -f "$COMPOSE_FILE" --project-name "$PROJECT_NAME" down
    else
        docker compose -f "$COMPOSE_FILE" --project-name "$PROJECT_NAME" down
    fi
    
    log_success "Services arrêtés"
}

# Redémarrage des services
restart_services() {
    log_info "Redémarrage des services..."
    
    if command -v docker-compose &> /dev/null; then
        docker-compose -f "$COMPOSE_FILE" --project-name "$PROJECT_NAME" restart
    else
        docker compose -f "$COMPOSE_FILE" --project-name "$PROJECT_NAME" restart
    fi
    
    log_success "Services redémarrés"
}

# Affichage des logs
show_logs() {
    log_info "Affichage des logs..."
    
    if command -v docker-compose &> /dev/null; then
        docker-compose -f "$COMPOSE_FILE" --project-name "$PROJECT_NAME" logs -f
    else
        docker compose -f "$COMPOSE_FILE" --project-name "$PROJECT_NAME" logs -f
    fi
}

# Vérification de l'état des services
check_status() {
    log_info "Vérification de l'état des services..."
    
    if command -v docker-compose &> /dev/null; then
        docker-compose -f "$COMPOSE_FILE" --project-name "$PROJECT_NAME" ps
    else
        docker compose -f "$COMPOSE_FILE" --project-name "$PROJECT_NAME" ps
    fi
    
    echo ""
    log_info "URLs de l'application:"
    log_info "  Frontend: http://164.160.40.182:3000"
    log_info "  Backend:  http://164.160.40.182:3001"
    log_info "  API Docs: http://164.160.40.182:3001/api/docs"
}

# Nettoyage
cleanup() {
    log_info "Nettoyage des ressources inutilisées..."
    
    docker system prune -f
    
    log_success "Nettoyage terminé"
}

# Aide
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --build     Construire les images avant le déploiement"
    echo "  --restart   Redémarrer les services"
    echo "  --stop      Arrêter les services"
    echo "  --logs      Afficher les logs"
    echo "  --status    Afficher le statut des services"
    echo "  --cleanup   Nettoyer les ressources Docker inutilisées"
    echo "  --help      Afficher cette aide"
    echo ""
    echo "Exemples:"
    echo "  $0 --build          # Déployer avec construction des images"
    echo "  $0 --restart        # Redémarrer les services"
    echo "  $0 --logs           # Afficher les logs en temps réel"
}

# Gestion des arguments
case "${1:-}" in
    --build)
        check_prerequisites
        generate_secrets
        build_images
        start_services
        check_status
        ;;
    --restart)
        restart_services
        check_status
        ;;
    --stop)
        stop_services
        ;;
    --logs)
        show_logs
        ;;
    --status)
        check_status
        ;;
    --cleanup)
        cleanup
        ;;
    --help)
        show_help
        ;;
    *)
        check_prerequisites
        generate_secrets
        start_services
        check_status
        ;;
esac

log_success "Déploiement terminé avec succès!"
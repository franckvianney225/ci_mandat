#!/bin/bash

# Script de déploiement CI-Mandat Production - Version Optimisée
# Usage: ./deploy-optimized.sh [--build] [--restart] [--logs] [--status] [--stop] [--cleanup]

set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
COMPOSE_FILE="docker-compose.production.optimized.yml"
ENV_FILE=".env.production"
PROJECT_NAME="ci_mandat_prod_optimized"

# Charger les variables d'environnement
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

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
    
    # Vérifier la configuration Nginx
    if [ ! -f "nginx/nginx.conf" ]; then
        log_warning "Configuration Nginx non trouvée, création du dossier..."
        mkdir -p nginx/ssl
        log_warning "Veuillez configurer les certificats SSL dans nginx/ssl/"
    fi
    
    log_success "Prérequis vérifiés"
}

# Génération des secrets sécurisés
generate_secrets() {
    log_info "Génération des secrets sécurisés..."
    
    if [ -f "scripts/generate-secrets.sh" ]; then
        ./scripts/generate-secrets.sh --force
    else
        log_warning "Script generate-secrets.sh non trouvé, utilisation de la méthode de secours..."
        
        # Générer un mot de passe PostgreSQL sécurisé
        DB_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9!@#$%^&*()_+-=' | head -c 32)
        
        # Générer des clés JWT sécurisées
        JWT_ACCESS_SECRET=$(openssl rand -base64 64 | tr -dc 'a-zA-Z0-9' | head -c 64)
        JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -dc 'a-zA-Z0-9' | head -c 64)
        
        # Générer des clés de chiffrement
        ENCRYPTION_KEY=$(openssl rand -hex 32)
        DATA_ENCRYPTION_IV=$(openssl rand -hex 16)
        
        # Générer un mot de passe Redis
        REDIS_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9!@#$%^&*()_+-=' | head -c 32)
        
        # Mettre à jour le fichier .env
        sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" "$ENV_FILE"
        sed -i "s/JWT_ACCESS_SECRET=.*/JWT_ACCESS_SECRET=$JWT_ACCESS_SECRET/" "$ENV_FILE"
        sed -i "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET/" "$ENV_FILE"
        sed -i "s/ENCRYPTION_KEY=.*/ENCRYPTION_KEY=$ENCRYPTION_KEY/" "$ENV_FILE"
        sed -i "s/DATA_ENCRYPTION_IV=.*/DATA_ENCRYPTION_IV=$DATA_ENCRYPTION_IV/" "$ENV_FILE"
        sed -i "s/REDIS_PASSWORD=.*/REDIS_PASSWORD=$REDIS_PASSWORD/" "$ENV_FILE"
        
        log_success "Nouveaux secrets générés et sauvegardés"
    fi
}

# Construction des images
build_images() {
    log_info "Construction des images Docker optimisées..."
    
    if command -v docker-compose &> /dev/null; then
        docker-compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" --project-name "$PROJECT_NAME" build --no-cache
    else
        docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" --project-name "$PROJECT_NAME" build --no-cache
    fi
    
    log_success "Images construites avec succès"
}

# Démarrage des services
start_services() {
    log_info "Démarrage des services optimisés..."
    
    if command -v docker-compose &> /dev/null; then
        docker-compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" --project-name "$PROJECT_NAME" up -d
    else
        docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" --project-name "$PROJECT_NAME" up -d
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
        docker-compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" --project-name "$PROJECT_NAME" restart
    else
        docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" --project-name "$PROJECT_NAME" restart
    fi
    
    log_success "Services redémarrés"
}

# Affichage des logs
show_logs() {
    log_info "Affichage des logs..."
    
    if command -v docker-compose &> /dev/null; then
        docker-compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" --project-name "$PROJECT_NAME" logs -f
    else
        docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" --project-name "$PROJECT_NAME" logs -f
    fi
}

# Vérification de l'état des services
check_status() {
    log_info "Vérification de l'état des services..."
    
    if command -v docker-compose &> /dev/null; then
        docker-compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" --project-name "$PROJECT_NAME" ps
    else
        docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" --project-name "$PROJECT_NAME" ps
    fi
    
    echo ""
    log_info "URLs de l'application:"
    log_info "  Frontend (HTTP): http://localhost:3000"
    log_info "  Frontend (HTTPS): https://localhost"
    log_info "  Backend:  http://localhost:3001"
    log_info "  API Docs: https://localhost/api/docs"
    log_info "  Nginx:    http://localhost:80 (redirection HTTPS)"
}

# Test des services
test_services() {
    log_info "Test des services optimisés..."
    
    # Charger les variables d'environnement
    source "$ENV_FILE"
    
    # Tester le frontend via HTTP
    if curl -s -f "http://localhost:3000" > /dev/null; then
        log_success "Frontend HTTP accessible"
    else
        log_error "Frontend HTTP inaccessible"
    fi
    
    # Tester le backend
    if curl -s -f "http://localhost:3001/api/v1/health" > /dev/null; then
        log_success "Backend accessible"
    else
        log_error "Backend inaccessible"
    fi
    
    # Tester Nginx
    if curl -s -f "http://localhost/health" > /dev/null; then
        log_success "Nginx accessible"
    else
        log_error "Nginx inaccessible"
    fi
    
    # Vérifier les ressources
    log_info "Vérification des ressources Docker..."
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | head -6
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
    echo "  --test      Tester l'accessibilité des services"
    echo "  --cleanup   Nettoyer les ressources Docker inutilisées"
    echo "  --help      Afficher cette aide"
    echo ""
    echo "Exemples:"
    echo "  $0 --build          # Déployer avec construction des images"
    echo "  $0 --restart        # Redémarrer les services"
    echo "  $0 --logs           # Afficher les logs en temps réel"
    echo "  $0 --test           # Tester l'accessibilité des services"
}

# Gestion des arguments
case "${1:-}" in
    --build)
        check_prerequisites
        generate_secrets
        build_images
        start_services
        sleep 45  # Attendre que les services démarrent (plus long avec Nginx)
        check_status
        test_services
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
    --test)
        test_services
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
        sleep 45  # Attendre que les services démarrent (plus long avec Nginx)
        check_status
        test_services
        ;;
esac

log_success "Déploiement optimisé terminé avec succès!"
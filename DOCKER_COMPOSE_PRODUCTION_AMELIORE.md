
# Configuration Docker Compose Production Améliorée

## Fichier docker-compose.production.yml Amélioré

```yaml
version: '3.8'

services:
  # Base de données PostgreSQL (accès local uniquement)
  postgres:
    image: postgres:15-alpine
    container_name: ci_mandat_postgres_prod
    environment:
      POSTGRES_DB: ci_mandat_db
      POSTGRES_USER: ci_mandat_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --locale=C"
      # Configuration de sécurité PostgreSQL
      POSTGRES_HOST_AUTH_METHOD: scram-sha-256
    ports:
      # NE PAS EXPOSER LE PORT 5432 - Base de données accessible uniquement en interne
      - "127.0.0.1:5432:5432"  # Seulement accessible depuis l'hôte local
    volumes:
      - postgres_data_prod:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
      - ./database/seed.sql:/docker-entrypoint-initdb.d/02-seed.sql
    networks:
      - ci_mandat_network_prod
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ci_mandat_user -d ci_mandat_db"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    # Configuration de sécurité supplémentaire
    command: >
      postgres
      -c shared_preload_libraries=pg_stat_statements
      -c pg_stat_statements.track=all
      -c max_connections=100
      -c shared_buffers=256MB
      -c effective_cache_size=1GB
      -c maintenance_work_mem=64MB
      -c checkpoint_completion_target=0.9
      -c wal_buffers=16MB
      -c default_statistics_target=100
      -c random_page_cost=1.1
      -c effective_io_concurrency=200
      -c work_mem=4MB
      -c min_wal_size=1GB
      -c max_wal_size=4GB

  # Cache Redis
  redis:
    image: redis:7-alpine
    container_name: ci_mandat_redis_prod
    restart: unless-stopped
    ports:
      - "127.0.0.1:6379:6379"  # Seulement accessible depuis l'hôte local
    volumes:
      - redis_data_prod:/data
    command: >
      redis-server
      --appendonly yes
      --requirepass ${REDIS_PASSWORD}
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
    networks:
      - ci_mandat_network_prod
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 3s
      retries: 3

  # Backend NestJS
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: ci_mandat_backend_prod
    environment:
      # Environnement
      NODE_ENV: production
      PORT: 3001
      
      # Base de données
      DATABASE_URL: postgresql://ci_mandat_user:${DB_PASSWORD}@postgres:5432/ci_mandat_db
      
      # Authentification JWT
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      JWT_ACCESS_EXPIRES: 15m
      JWT_REFRESH_EXPIRES: 7d
      
      # Chiffrement
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
      DATA_ENCRYPTION_IV: ${DATA_ENCRYPTION_IV}
      
      # Redis
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      
      # URLs
      FRONTEND_URL: ${FRONTEND_URL}
      BACKEND_URL: ${BACKEND_URL}
      ALLOWED_ORIGINS: ${ALLOWED_ORIGINS}
      
      # Sécurité
      RATE_LIMIT_WINDOW: 900000
      MAX_LOGIN_ATTEMPTS: 5
      SESSION_TIMEOUT: 3600000
      
      # Logging
      LOG_LEVEL: info
    ports:
      - "3001:3001"
    volumes:
      - pdf_storage_prod:/app/storage/pdfs
    networks:
      - ci_mandat_network_prod
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Frontend Next.js
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: ci_mandat_frontend_prod
    environment:
      # Configuration Next.js
      NODE_ENV: production
      PORT: 3000
      
      # URL du backend
      NEXT_PUBLIC_API_URL: ${BACKEND_URL}/api/v1
      NEXT_PUBLIC_FRONTEND_URL: ${FRONTEND_URL}
    ports:
      - "3000:3000"
    networks:
      - ci_mandat_network_prod
    restart: unless-stopped
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  postgres_data_prod:
    driver: local
  redis_data_prod:
    driver: local
  pdf_storage_prod:
    driver: local

networks:
  ci_mandat_network_prod:
    driver: bridge
    # Configuration de sécurité du réseau
    ipam:
      driver: default
      config:
        - subnet: 172.20.0.0/16
```

## Script de Déploiement Amélioré

**Mettre à jour `deploy.sh` :**

```bash
#!/bin/bash

# Script de déploiement CI-Mandat Production - Version Améliorée
# Usage: ./deploy.sh [--build] [--restart] [--logs] [--status] [--stop] [--cleanup]

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
        docker-compose -f "$COMPOSE_FILE" --project-name "$PROJECT_NAME" build --no-cache
    else
        docker compose -f "$COMPOSE_FILE" --project-name "$PROJECT_NAME" build --no-cache
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
    log_info "  Frontend: ${FRONTEND_URL}"
    log_info "  Backend:  ${BACKEND_URL}"
    log_info "  API Docs: ${BACKEND_URL}/api/docs"
}

# Nettoyage
cleanup() {
    log_info "Nettoyage des ressources inutilisées..."
    
    docker system prune -f
    
    log_success "Nettoyage terminé"
}

# Test des services
test_services() {
    log_info "Test des services..."
    
    # Charger les variables d'environnement
    source "$ENV_FILE"
    
    # Tester le frontend
    if curl -s -f "http://localhost:3000" > /dev/null; then
        log_success "Frontend accessible"
    else
        log_error "Frontend inaccessible"
    fi
    
    # Tester le backend
    if curl -s -f "http://localhost:3001/api/v1/health" > /dev/null; then
        log_success "Backend accessible"
    else
        log_error "Backend inaccessible"
    fi
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
        sleep 30  # Attendre que les services démarrent
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
        sleep 30  # Attendre que les services démarrent
        check_status
        test_services
        ;;
esac

log_success "Déploiement terminé avec succès!"
```

## Instructions de Mise à Jour

1. **Remplacer les Dockerfiles existants** avec le contenu du guide
2. **Mettre à jour docker-compose.production.yml** avec la version améliorée
3. **Créer le fichier .env.production.example** pour le template
4. **Mettre à jour deploy.sh** avec la version améliorée
5. **Tester localement** avant le déploiement en production

## Points d'Amélioration Clés

- ✅ **Build TypeScript** : Installation complète des dépendances
- ✅ **Sécurité** : Utilisateurs non-root appropriés
- ✅ **Puppeteer** : Configuration Chromium compl
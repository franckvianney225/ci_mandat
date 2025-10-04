# Plan de Déploiement Docker - CI-Mandat Production

## Architecture du Projet

Le projet CI-Mandat est composé de 4 services principaux :

1. **Frontend** : Next.js (port 3000)
2. **Backend** : NestJS (port 3001) 
3. **Base de données** : PostgreSQL (port 5432)
4. **Cache** : Redis (port 6379)

## Fichiers Docker à Créer

### 1. Dockerfile Frontend (Next.js)
```
Dockerfile.frontend
```

### 2. Dockerfile Backend (NestJS)
```
Dockerfile.backend
```

### 3. Docker Compose Production
```
docker-compose.production.yml
```

### 4. Variables d'Environnement
```
.env.production
```

### 5. Scripts de Déploiement
```
deploy.sh
```

### 6. Schéma SQL Complet
```
database/schema.sql (à créer)
```

## Configuration de Sécurité

### Base de Données (Accès Local Uniquement)
- PostgreSQL configuré pour n'accepter que les connexions depuis le réseau Docker interne
- Pas d'exposition du port 5432 vers l'extérieur
- Authentification forte avec mots de passe complexes

### Réseau Docker
- Réseau interne isolé pour les conteneurs
- Seuls les ports nécessaires exposés (3000, 3001)

## Variables d'Environnement de Production

### Backend (.env.production)
```bash
NODE_ENV=production
PORT=3001

# Base de données
DATABASE_URL=postgresql://ci_mandat_user:${DB_PASSWORD}@postgres:5432/ci_mandat_db

# Sécurité JWT
JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}

# Chiffrement
ENCRYPTION_KEY=${ENCRYPTION_KEY}
DATA_ENCRYPTION_IV=${DATA_ENCRYPTION_IV}

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}

# URLs
FRONTEND_URL=http://164.160.40.182:3000
BACKEND_URL=http://164.160.40.182:3001
ALLOWED_ORIGINS=http://164.160.40.182:3000
```

### Frontend
- API_URL pointant vers le backend interne
- Configuration pour build de production

## Structure des Volumes

```
volumes:
  postgres_data:    # Données PostgreSQL
  redis_data:       # Données Redis
  pdf_storage:      # PDF générés
```

## Procédure de Déploiement

1. **Préparation** : Générer les secrets et configurer les variables d'environnement
2. **Build** : Construire les images Docker
3. **Déploiement** : Lancer les conteneurs avec docker-compose
4. **Vérification** : Tester l'application et les services

## Sécurité Renforcée

- Base de données accessible uniquement en local (conteneur à conteneur)
- Mots de passe forts générés automatiquement
- Configuration SSL pour PostgreSQL
- Rate limiting activé
- Logs de sécurité
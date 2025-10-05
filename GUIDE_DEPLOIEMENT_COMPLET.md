# Guide de Déploiement Complet CI-Mandat

## Plan d'Action pour un Déploiement Réussi

### Étape 1: Préparation des Fichiers

#### 1.1 Mettre à jour le Dockerfile Backend
**Remplacer le contenu de `backend/Dockerfile` avec :**

```dockerfile
# Dockerfile pour le Backend NestJS CI-Mandat - Version Améliorée
FROM node:18-alpine AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration package.json d'abord
COPY package*.json ./
COPY tsconfig.json ./

# Installer TOUTES les dépendances (y compris devDependencies) pour le build
RUN npm ci

# Copier le code source
COPY src/ ./src/

# Build de l'application
RUN npm run build

# Image de production
FROM node:18-alpine AS runner

# Installer les dépendances système nécessaires
RUN apk add --no-cache \
    curl \
    dumb-init \
    # Puppeteer dependencies
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji

# Définir les variables d'environnement pour Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    CHROMIUM_PATH=/usr/bin/chromium-browser

# Créer un utilisateur non-root spécifique au backend
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001

# Créer le répertoire pour les PDFs
RUN mkdir -p /app/storage/pdfs && \
    chown -R backend:nodejs /app/storage

WORKDIR /app

# Copier les fichiers de build depuis l'étape builder
COPY --from=builder --chown=backend:nodejs /app/dist ./dist
COPY --from=builder --chown=backend:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=backend:nodejs /app/package.json ./package.json

# Copier les fichiers de configuration supplémentaires
COPY --chown=backend:nodejs tsconfig.json ./

# Basculer vers l'utilisateur non-root
USER backend

# Exposer le port
EXPOSE 3001

# Variables d'environnement pour NestJS
ENV PORT=3001
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

# Health check amélioré
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/api/v1/health || exit 1

# Utiliser dumb-init pour une meilleure gestion des signaux
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Commande de démarrage
CMD ["node", "dist/main.js"]
```

#### 1.2 Mettre à jour le Dockerfile Frontend
**Remplacer le contenu de `Dockerfile.frontend` avec :**

```dockerfile
# Dockerfile pour le Frontend Next.js CI-Mandat - Version Améliorée
FROM node:18-alpine AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration package.json d'abord (optimisation des layers)
COPY package*.json ./
COPY next.config.ts ./
COPY tsconfig.json ./
COPY postcss.config.mjs ./
COPY eslint.config.mjs ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY src/ ./src/
COPY public/ ./public/

# Build de l'application
RUN npm run build

# Image de production
FROM node:18-alpine AS runner

# Installer curl pour les health checks
RUN apk add --no-cache curl

# Créer un utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

# Copier les fichiers de build depuis l'étape builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./

# Basculer vers l'utilisateur non-root
USER nextjs

# Exposer le port
EXPOSE 3000

# Variables d'environnement pour Next.js
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

# Health check corrigé (pas d'endpoint /api/health dans Next.js)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# Commande de démarrage
CMD ["npm", "start"]
```

#### 1.3 Créer le Dockerfile de Développement
**Créer `backend/Dockerfile.dev` :**

```dockerfile
# Dockerfile de développement pour le Backend NestJS
FROM node:18-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY tsconfig.json ./

# Installer toutes les dépendances
RUN npm ci

# Copier le code source
COPY src/ ./src/

# Exposer le port
EXPOSE 3001

# Commande de développement avec hot reload
CMD ["npm", "run", "start:dev"]
```

#### 1.4 Créer le Template d'Environnement
**Créer `.env.production.example` :**

```env
# ===========================================
# Template des Variables d'Environnement Production
# ===========================================

# Environnement
NODE_ENV=production

# URLs de l'application
FRONTEND_URL=http://164.160.40.182:3000
BACKEND_URL=http://164.160.40.182:3001
ALLOWED_ORIGINS=http://164.160.40.182:3000

# Sécurité - À MODIFIER OBLIGATOIREMENT
DB_PASSWORD=ChangeMe_StrongPassword123!
JWT_ACCESS_SECRET=ChangeMe_SuperSecretJWTKeyForAccessToken32CharsMin
JWT_REFRESH_SECRET=ChangeMe_SuperSecretJWTKeyForRefreshToken32CharsMin
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
DATA_ENCRYPTION_IV=0123456789abcdef0123456789abcdef
REDIS_PASSWORD=ChangeMe_RedisStrongPassword123!

# Configuration avancée
LOG_LEVEL=info
RATE_LIMIT_WINDOW=900000
MAX_LOGIN_ATTEMPTS=5
SESSION_TIMEOUT=3600000
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
```

### Étape 2: Configuration de l'Environnement

#### 2.1 Préparer les Variables d'Environnement
```bash
# Copier le template
cp .env.production.example .env.production

# Éditer avec vos valeurs réelles
nano .env.production
```

#### 2.2 Variables Obligatoires à Modifier
- `DB_PASSWORD` : Mot de passe fort pour PostgreSQL
- `JWT_ACCESS_SECRET` : Clé secrète d'au moins 32 caractères
- `JWT_REFRESH_SECRET` : Clé secrète d'au moins 32 caractères
- `ENCRYPTION_KEY` : Clé de chiffrement de 64 caractères hexadécimaux
- `DATA_ENCRYPTION_IV` : Vecteur d'initialisation de 32 caractères hexadécimaux
- `REDIS_PASSWORD` : Mot de passe fort pour Redis

### Étape 3: Test Local

#### 3.1 Tester le Build
```bash
# Construire les images
docker-compose -f docker-compose.production.yml build

# Vérifier que le build réussit
docker images | grep ci_mandat
```

#### 3.2 Démarrer les Services
```bash
# Démarrer en arrière-plan
docker-compose -f docker-compose.production.yml up -d

# Vérifier l'état des services
docker-compose -f docker-compose.production.yml ps
```

#### 3.3 Vérifier les Logs
```bash
# Voir les logs en temps réel
docker-compose -f docker-compose.production.yml logs -f

# Ou voir les logs d'un service spécifique
docker-compose -f docker-compose.production.yml logs backend
docker-compose -f docker-compose.production.yml logs frontend
```

#### 3.4 Tests de Fonctionnalité
```bash
# Tester l'accès au frontend
curl -f http://localhost:3000

# Tester l'API backend
curl -f http://localhost:3001/api/v1/health

# Tester la base de données
docker exec ci_mandat_postgres_prod pg_isready -U ci_mandat_user -d ci_mandat_db

# Tester Redis
docker exec ci_mandat_redis_prod redis-cli -a votre_mot_de_passe_redis ping
```

### Étape 4: Déploiement en Production

#### 4.1 Utiliser le Script de Déploiement
```bash
# Rendre le script exécutable
chmod +x deploy.sh

# Déployer avec construction des images
./deploy.sh --build

# Ou déployer sans rebuild (si les images existent)
./deploy.sh
```

#### 4.2 Vérifier le Déploiement
```bash
# Vérifier le statut
./deploy.sh --status

# Tester l'accessibilité
./deploy.sh --test

# Voir les logs
./deploy.sh --logs
```

### Étape 5: Surveillance et Maintenance

#### 5.1 Commandes de Surveillance
```bash
# Voir l'utilisation des ressources
docker stats

# Voir les conteneurs en cours d'exécution
docker ps

# Voir l'espace disque utilisé
docker system df
```

#### 5.2 Sauvegarde des Données
```bash
# Sauvegarder la base de données PostgreSQL
docker exec ci_mandat_postgres_prod pg_dump -U ci_mandat_user ci_mandat_db > backup_$(date +%Y%m%d).sql

# Sauvegarder les données Redis
docker exec ci_mandat_redis_prod redis-cli -a votre_mot_de_passe_redis SAVE
```

#### 5.3 Mise à Jour
```bash
# Arrêter les services
./deploy.sh --stop

# Mettre à jour le code
git pull

# Redéployer avec les nouvelles images
./deploy.sh --build
```

## Résolution des Problèmes Courants

### Problème: Build Échoue
**Solution:**
- Vérifier que toutes les dépendances sont dans package.json
- S'assurer que TypeScript compile correctement
- Vérifier les logs de build avec `docker-compose build --no-cache`

### Problème: Service Ne Démarre Pas
**Solution:**
- Vérifier les variables d'environnement
- Consulter les logs avec `docker-compose logs [service]`
- Vérifier les health checks

### Problème: Connexion Base de Données
**Solution:**
- Vérifier que PostgreSQL est accessible
- Confirmer les identifiants dans .env.production
- Tester la connexion manuellement

### Problème: Puppeteer/Chromium
**Solution:**
- Vérifier que Chromium est installé dans le conteneur
- Confirmer les variables d'environnement PUPPETEER_*
- Tester la génération de PDF manuellement

## Points de Vérification Post-Déploiement

- [ ] Tous les services sont en état "healthy"
- [ ] Frontend accessible sur le port 3000
- [ ] Backend accessible sur le port 3001
- [ ] Base de données PostgreSQL opérationnelle
- [ ] Cache Redis fonctionnel
- [ ] Génération de PDFs opérationnelle
- [ ] Authentification JWT fonctionnelle
- [ ] Logs sans erreurs critiques

## Sécurité

- [ ] Mots de passe changés des valeurs par défaut
- [ ] Ports de base de données non exposés publiquement
- [ ] Utilisateurs non-root utilisés dans les conteneurs
- [ ] Secrets stockés de manière sécurisée
- [ ] Health checks configurés

Ce guide vous permettra de déployer votre application CI-Mandat de manière fiable et sécurisée sur votre serveur.
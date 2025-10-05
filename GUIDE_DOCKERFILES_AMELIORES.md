# Guide d'Amélioration des Dockerfiles CI-Mandat

## Problèmes Identifiés et Solutions

### 1. Dockerfile Backend - Problèmes Critiques

**Problèmes actuels :**
- Utilisation de `npm ci --only=production` avant la copie des sources
- Manque des devDependencies pour le build TypeScript
- Utilisateur `nextjs` inapproprié pour le backend
- Configuration Puppeteer incomplète

**Dockerfile Backend Corrigé :**

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

### 2. Dockerfile Frontend - Améliorations

**Dockerfile Frontend Amélioré :**

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

### 3. Dockerfile de Développement Backend

**Créer le fichier `backend/Dockerfile.dev` :**

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

### 4. Fichier d'Environnement de Production Template

**Créer `.env.production.example` :**

```env
# ===========================================
# Template des Variables d'Environnement Production
# ===========================================

# Environnement
NODE_ENV=production

# URLs de l'application
FRONTEND_URL=http://votre-domaine.com:3000
BACKEND_URL=http://votre-domaine.com:3001
ALLOWED_ORIGINS=http://votre-domaine.com:3000

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

## Instructions de Déploiement

### 1. Préparation
```bash
# Copier le template d'environnement
cp .env.production.example .env.production

# Éditer les variables de sécurité
nano .env.production
```

### 2. Test Local
```bash
# Tester le build
docker-compose -f docker-compose.production.yml build

# Démarrer les services
docker-compose -f docker-compose.production.yml up -d

# Vérifier les logs
docker-compose -f docker-compose.production.yml logs -f
```

### 3. Déploiement avec le Script
```bash
# Rendre le script exécutable
chmod +x deploy.sh

# Déployer avec build
./deploy.sh --build

# Vérifier le statut
./deploy.sh --status
```

## Points Clés Résolus

1. **Build TypeScript** : Installation complète des dépendances avant le build
2. **Sécurité** : Utilisateurs non-root appropriés pour chaque service
3. **Puppeteer** : Configuration complète de Chromium
4. **Health Checks** : Endpoints corrigés et délais adaptés
5. **Optimisation** : Meilleure gestion des layers Docker
6. **Documentation** : Guide complet pour le déploiement

## Vérifications Post-Déploiement

1. Vérifier que tous les services sont en état "healthy"
2. Tester l'accès au frontend et au backend
3. Vérifier la génération de PDFs
4. Confirmer les connexions à la base de données
5. Surveiller les logs pour détecter les erreurs
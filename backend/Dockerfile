# Dockerfile pour le Backend NestJS CI-Mandat - Version Améliorée
FROM node:18-alpine AS builder

# Installer les outils de build pour les modules natifs (bcrypt)
RUN apk add --no-cache \
    python3 \
    make \
    g++

# Définir les variables d'environnement pour Puppeteer AVANT l'installation
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    CHROMIUM_PATH=/usr/bin/chromium-browser

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration package.json d'abord
COPY package*.json ./
COPY tsconfig.json ./

# Installer TOUTES les dépendances (y compris devDependencies) pour le build
RUN npm ci --registry=https://registry.npmjs.org/ --fetch-retries=5 --fetch-timeout=60000

# Copier le code source
COPY src/ ./src/
COPY puppeteer-config.js ./

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

# Créer les répertoires pour les PDFs et logs
RUN mkdir -p /app/storage/pdfs && \
    mkdir -p /app/logs && \
    chown -R backend:nodejs /app/storage && \
    chown -R backend:nodejs /app/logs

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

# Commande de démarrage avec initialisation de l'admin
CMD ["sh", "-c", "node dist/scripts/init-admin.js && node dist/main.js"]
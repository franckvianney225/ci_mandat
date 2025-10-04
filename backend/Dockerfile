# Dockerfile pour le Backend NestJS CI-Mandat
FROM node:18-alpine AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY tsconfig.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY src/ ./src/

# Build de l'application
RUN npm run build

# Image de production
FROM node:18-alpine AS runner

# Installer les dépendances système nécessaires
RUN apk add --no-cache \
    curl \
    dumb-init

# Installer Puppeteer pour la génération de PDF
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Définir les variables d'environnement pour Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

WORKDIR /app

# Copier les fichiers de build depuis l'étape builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copier les fichiers de configuration supplémentaires
COPY tsconfig.json ./

# Changer les propriétaires des fichiers pour l'utilisateur nextjs
RUN chown -R nextjs:nodejs /app

# Basculer vers l'utilisateur non-root
USER nextjs

# Exposer le port
EXPOSE 3001

# Variable d'environnement pour NestJS
ENV PORT 3001
ENV NODE_ENV production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3001/api/v1/health || exit 1

# Utiliser dumb-init pour une meilleure gestion des signaux
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Commande de démarrage
CMD ["node", "dist/main.js"]
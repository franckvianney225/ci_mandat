#!/bin/bash

# Script pour reconstruire le frontend avec les variables d'environnement actuelles

echo "🔨 Reconstruction du frontend CI-Mandat..."

# Arrêter et supprimer le conteneur frontend existant
docker stop ci_mandat_frontend_prod 2>/dev/null || true
docker rm ci_mandat_frontend_prod 2>/dev/null || true

# Reconstruire l'image frontend sans cache
echo "📦 Construction de l'image frontend (sans cache)..."
docker build --no-cache -f Dockerfile.frontend -t ci_mandat_frontend:latest .

# Démarrer le nouveau conteneur
echo "🚀 Démarrage du nouveau conteneur frontend..."
docker run -d \
  --name ci_mandat_frontend_prod \
  --network ci_mandat_network \
  -p 3000:3000 \
  --env-file .env.production \
  ci_mandat_frontend:latest

echo "✅ Frontend reconstruit et redémarré avec succès!"
echo "🌐 Application disponible sur: http://164.160.40.182:3000"
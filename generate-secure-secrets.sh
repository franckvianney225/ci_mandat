#!/bin/bash

echo "🔐 Génération de secrets sécurisés pour CI-Mandat..."

# Générer des secrets sécurisés
JWT_ACCESS_SECRET=$(openssl rand -base64 64 | tr -d '\n')
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d '\n')
ENCRYPTION_KEY=$(openssl rand -base64 32 | tr -d '\n')
DATA_ENCRYPTION_IV=$(openssl rand -base64 16 | tr -d '\n')
DB_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')

# Créer le fichier .env avec les secrets
cat > .env << EOF
# Secrets de sécurité CI-Mandat
DB_PASSWORD=${DB_PASSWORD}
REDIS_PASSWORD=${REDIS_PASSWORD}
JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
DATA_ENCRYPTION_IV=${DATA_ENCRYPTION_IV}

# URLs de l'application
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
EOF

echo "✅ Secrets générés avec succès dans le fichier .env"
echo "📋 Variables créées :"
echo "   - DB_PASSWORD"
echo "   - REDIS_PASSWORD" 
echo "   - JWT_ACCESS_SECRET"
echo "   - JWT_REFRESH_SECRET"
echo "   - ENCRYPTION_KEY"
echo "   - DATA_ENCRYPTION_IV"
echo ""
echo "⚠️  IMPORTANT : Conservez ce fichier .env en sécurité !"
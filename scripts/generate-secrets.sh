#!/bin/bash

# Script de génération de secrets sécurisés pour CI-Mandat
# Usage: ./scripts/generate-secrets.sh

set -e

echo "🔐 Génération de secrets sécurisés pour CI-Mandat"
echo "=================================================="

# Vérifier si openssl est disponible
if ! command -v openssl &> /dev/null; then
    echo "❌ openssl n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Créer le dossier scripts s'il n'existe pas
mkdir -p scripts

# Générer les secrets
echo ""
echo "📋 Génération des secrets..."

# JWT Secrets (32 caractères minimum)
JWT_ACCESS_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Clé de chiffrement (64 caractères hex)
ENCRYPTION_KEY=$(openssl rand -hex 32)

# IV de chiffrement (16 caractères hex)
DATA_ENCRYPTION_IV=$(openssl rand -hex 16)

# Mot de passe base de données
DB_PASSWORD=$(openssl rand -base64 16 | tr -d '/+' | head -c 20)

# Mot de passe Redis
REDIS_PASSWORD=$(openssl rand -base64 16 | tr -d '/+' | head -c 20)

# Mot de passe pgAdmin
PGADMIN_PASSWORD=$(openssl rand -base64 12 | tr -d '/+' | head -c 16)

# Afficher les secrets générés
echo ""
echo "✅ Secrets générés avec succès:"
echo ""
echo "🔑 JWT_ACCESS_SECRET: $JWT_ACCESS_SECRET"
echo "🔑 JWT_REFRESH_SECRET: $JWT_REFRESH_SECRET"
echo "🔐 ENCRYPTION_KEY: $ENCRYPTION_KEY"
echo "🔐 DATA_ENCRYPTION_IV: $DATA_ENCRYPTION_IV"
echo "🗄️  DB_PASSWORD: $DB_PASSWORD"
echo "🔴 REDIS_PASSWORD: $REDIS_PASSWORD"
echo "📊 PGADMIN_PASSWORD: $PGADMIN_PASSWORD"

# Créer un fichier .env.local avec les secrets
echo ""
echo "📁 Création du fichier .env.local..."

cat > .env.local << EOF
# ============================================
# CI-Mandat - Secrets Générés
# Généré le: $(date)
# ============================================

# SÉCURITÉ JWT
JWT_ACCESS_SECRET=$JWT_ACCESS_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET

# CHIFFREMENT
ENCRYPTION_KEY=$ENCRYPTION_KEY
DATA_ENCRYPTION_IV=$DATA_ENCRYPTION_IV

# BASE DE DONNÉES
DB_PASSWORD=$DB_PASSWORD

# REDIS
REDIS_PASSWORD=$REDIS_PASSWORD

# PGADMIN
PGADMIN_PASSWORD=$PGADMIN_PASSWORD

# ============================================
# ⚠️  AVERTISSEMENT DE SÉCURITÉ
# ============================================
# Ce fichier contient des informations sensibles.
# Ne le commitez JAMAIS dans le repository Git.
# Ne le partagez JAMAIS avec qui que ce soit.
# Stockez-le dans un endroit sécurisé.
# ============================================
EOF

echo "✅ Fichier .env.local créé avec les secrets générés"
echo ""
echo "⚠️  AVERTISSEMENTS IMPORTANTS:"
echo "   • NE COMMITEZ PAS le fichier .env.local"
echo "   • Ajoutez .env.local à votre .gitignore"
echo "   • Stockez ces secrets dans un gestionnaire de mots de passe"
echo "   • Régénérez ces secrets pour chaque environnement (dev, staging, prod)"
echo ""
echo "🚀 Pour utiliser ces secrets:"
echo "   1. Copiez .env.local en .env"
echo "   2. Remplissez les autres variables manquantes"
echo "   3. Démarrez l'application avec: docker-compose up"
echo ""
echo "🔧 Pour Docker Compose:"
echo "   export DB_PASSWORD=\"$DB_PASSWORD\""
echo "   export REDIS_PASSWORD=\"$REDIS_PASSWORD\""
echo "   export JWT_ACCESS_SECRET=\"$JWT_ACCESS_SECRET\""
echo "   export JWT_REFRESH_SECRET=\"$JWT_REFRESH_SECRET\""
echo "   export ENCRYPTION_KEY=\"$ENCRYPTION_KEY\""
echo "   export DATA_ENCRYPTION_IV=\"$DATA_ENCRYPTION_IV\""
echo "   export PGADMIN_PASSWORD=\"$PGADMIN_PASSWORD\""
echo ""
echo "📚 Documentation: voir README.md pour plus de détails"
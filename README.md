# CI-Mandat - Application de Gestion de Mandats Électoraux

## 📋 Description

CI-Mandat est une application web complète pour la gestion sécurisée des mandats électoraux. Elle permet la création, validation et génération de PDF de mandats avec système de vérification par QR code.

## 🏗️ Architecture

- **Frontend**: Next.js 15 + React 19 + TypeScript + Tailwind CSS
- **Backend**: NestJS + PostgreSQL + TypeORM
- **Sécurité**: JWT + bcrypt + validation des données
- **PDF**: jsPDF avec QR codes et filigranes de sécurité

## 🚀 Installation Rapide

### Prérequis
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+

### 1. Cloner le projet
```bash
git clone <repository-url>
cd ci_mandat
```

### 2. Génération des secrets sécurisés

**Option 1: Script automatique (Recommandé)**
```bash
# Générer tous les secrets nécessaires
./scripts/generate-secrets.sh

# Le script crée un fichier .env.local avec les secrets générés
# Copiez-le en .env et complétez les autres variables
cp .env.local .env
```

**Option 2: Manuellement**
```bash
# Copiez le fichier d'exemple
cp .env.example .env

# Remplissez les variables dans .env avec des valeurs sécurisées
```

### 3. Configuration de l'environnement

**Backend (.env)**
```env
# Base de données
DATABASE_URL=postgresql://ci_mandat_user:VOTRE_MOT_DE_PASSE_DB@localhost:5432/ci_mandat_db

# Sécurité JWT (générés automatiquement)
JWT_ACCESS_SECRET=votre_super_secret_access_key_32_chars_minimum
JWT_REFRESH_SECRET=votre_super_secret_refresh_key_32_chars_minimum

# Chiffrement (générés automatiquement)
ENCRYPTION_KEY=64_char_hex_encryption_key_for_aes_256_gcm_encryption
DATA_ENCRYPTION_IV=16_char_hex_initialization_vector

# Configuration CORS
ALLOWED_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001

# Email SMTP (optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=votre_email@gmail.com
SMTP_PASSWORD=votre_mot_de_passe_app
FROM_EMAIL=votre_email@gmail.com
FROM_NAME=CI-Mandat
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=votre_cle_recaptcha
```

### 4. Démarrage avec Docker (Recommandé)

```bash
# Définir les variables d'environnement pour Docker
export DB_PASSWORD="votre_mot_de_passe_db"
export JWT_ACCESS_SECRET="votre_secret_jwt"
# ... autres variables

# Démarrer tous les services
docker-compose up -d

# Vérifier que tout fonctionne
docker-compose ps
```

Les services seront disponibles sur :
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **PostgreSQL**: localhost:5432
- **pgAdmin**: http://localhost:8080

### 5. Installation manuelle (Alternative)

#### Backend
```bash
cd backend
npm install
npm run start:dev
```

#### Frontend
```bash
npm install
npm run dev
```

## 🔐 Configuration de Sécurité

### Gestion des Secrets

**⚠️ IMPORTANT: Ne commitez jamais les secrets dans Git**

- Utilisez le script `./scripts/generate-secrets.sh` pour générer des secrets sécurisés
- Stockez les secrets dans des variables d'environnement
- Utilisez un gestionnaire de secrets pour la production (AWS Secrets Manager, HashiCorp Vault, etc.)
- Régénérez les secrets pour chaque environnement (dev, staging, prod)

### Bonnes Pratiques de Sécurité

1. **Secrets d'Application**:
   - Régénérez tous les secrets après chaque déploiement en production
   - Utilisez des secrets différents pour chaque environnement
   - Ne partagez jamais les secrets par email ou chat

2. **Base de Données**:
   - Utilisez des mots de passe forts (min. 16 caractères)
   - Limitez les accès réseau à la base de données
   - Activez le chiffrement SSL/TLS

3. **JWT**:
   - Utilisez des secrets d'au moins 32 caractères
   - Configurez des durées d'expiration courtes pour les tokens d'accès
   - Utilisez des tokens de rafraîchissement avec expiration plus longue

### Génération Manuelle des Clés

```bash
# Générer une clé JWT sécurisée (32 caractères minimum)
openssl rand -base64 32

# Générer une clé de chiffrement (64 caractères hex)
openssl rand -hex 32

# Générer un IV (16 caractères hex)
openssl rand -hex 16
```

### Premier administrateur

Après le démarrage, connectez-vous à pgAdmin (http://localhost:8080) et exécutez :

```sql
INSERT INTO users (email, password_hash, role, status, personal_data) 
VALUES (
  'admin@ci-mandat.com',
  -- Mot de passe: admin123 (hashé avec bcrypt)
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'super_admin',
  'active',
  '{"firstName": "Admin", "lastName": "System"}'
);
```

## 📊 Structure de la Base de Données

### Tables principales
- `users` - Utilisateurs et administrateurs
- `mandates` - Mandats électoraux
- `email_config` - Configuration SMTP
- `sessions` - Sessions utilisateur
- `audit_logs` - Logs de sécurité

### Schéma des mandats
```sql
-- Statuts possibles d'un mandat
draft → pending_validation → admin_approved → super_admin_approved → completed
```

## 🔧 Développement

### Commandes utiles

#### Backend
```bash
cd backend

# Développement
npm run start:dev

# Build production
npm run build
npm run start:prod

# Base de données
npm run migration:run
npm run db:seed

# Tests
npm test
```

#### Frontend
```bash
# Développement
npm run dev

# Build production
npm run build
npm run start

# Linting
npm run lint
```

### API Endpoints Principaux

#### Authentification
- `POST /api/v1/auth/login` - Connexion
- `POST /api/v1/auth/logout` - Déconnexion
- `GET /api/v1/auth/profile` - Profil utilisateur

#### Mandats
- `GET /api/v1/mandates` - Liste des mandats
- `POST /api/v1/mandates` - Créer un mandat
- `PATCH /api/v1/mandates/:id/validate-admin` - Validation admin
- `PATCH /api/v1/mandates/:id/validate-super-admin` - Validation super admin
- `GET /api/v1/mandates/:id/pdf` - Générer PDF

#### Utilisateurs
- `GET /api/v1/users` - Liste des utilisateurs
- `POST /api/v1/users` - Créer un utilisateur
- `PATCH /api/v1/users/:id` - Modifier un utilisateur

## 🛡️ Sécurité

### Fonctionnalités implémentées
- Authentification JWT avec refresh tokens
- Validation des données avec class-validator
- Protection CSRF et rate limiting
- Chiffrement des données sensibles
- Logs d'audit complets
- Filigranes de sécurité sur les PDF

### Bonnes pratiques
- Mots de passe hashés avec bcrypt
- Sessions sécurisées avec HttpOnly cookies
- Validation des entrées utilisateur
- Protection contre les injections SQL

## 📧 Configuration Email

### Configuration SMTP
1. Allez dans l'interface d'administration
2. Section "Paramètres" → "Configuration Email"
3. Remplissez les informations SMTP
4. Testez la connexion

### Templates d'email inclus
- Confirmation de soumission
- Notification de validation
- Notification de rejet
- Alertes administrateur

## 🐛 Dépannage

### Problèmes courants

**Erreur de connexion à la base de données**
```bash
# Vérifier que PostgreSQL est démarré
docker-compose ps postgres

# Redémarrer les services
docker-compose restart postgres backend
```

**Erreur CORS**
- Vérifier `ALLOWED_ORIGINS` dans les variables d'environnement
- S'assurer que le frontend et backend utilisent les bons ports

**Problèmes de génération PDF**
- Vérifier que Puppeteer est correctement installé
- Vérifier les permissions d'écriture

## 📞 Support

Pour toute question ou problème :
1. Consultez les logs dans `backend/logs/`
2. Vérifiez la configuration des variables d'environnement
3. Consultez les issues sur le repository

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

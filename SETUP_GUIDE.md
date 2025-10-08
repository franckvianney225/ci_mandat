# Guide de Configuration CI-Mandat

## 📋 Vue d'Ensemble

Ce guide vous aidera à configurer et lancer l'application CI-Mandat, une application complète de gestion de mandats avec workflow de validation à deux niveaux.

## 🚀 Démarrage Rapide

### Prérequis

- **Docker** et **Docker Compose**
- **Node.js** 18+ (pour le développement)
- **PostgreSQL** 15+ (ou utilisation de Docker)

### 1. Configuration de l'Environnement

```bash
# Cloner le projet (si ce n'est pas déjà fait)
git clone <votre-repo>
cd ci_mandat

# Copier le fichier d'environnement
cp backend/.env.example backend/.env

# Éditer le fichier .env avec vos configurations
nano backend/.env
```

### 2. Lancement avec Docker (Recommandé)

```bash
# Démarrer tous les services
docker-compose up -d

# Vérifier l'état des services
docker-compose ps

# Voir les logs
docker-compose logs -f
```

### 3. Installation Manuelle (Développement)

#### Base de Données

```bash
# Créer la base de données PostgreSQL
createdb ci_mandat_db

# Exécuter le schéma
psql -d ci_mandat_db -f database/schema.sql

# Insérer les données de test
psql -d ci_mandat_db -f database/seed.sql
```

#### Backend

```bash
# Installer les dépendances
cd backend
npm install

# Lancer en mode développement
npm run start:dev
```

#### Frontend

```bash
# Le frontend Next.js existe déjà
# Installer les dépendances (si nécessaire)
npm install

# Lancer le développement
npm run dev
```

## 🌐 Services Disponibles

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Application Next.js |
| Backend API | http://localhost:3001 | API NestJS |
| Documentation API | http://localhost:3001/api/docs | Swagger UI |
| PostgreSQL | localhost:5432 | Base de données |
| pgAdmin | http://localhost:8080 | Interface d'admin DB |

## 🔐 Comptes de Test

### Super Administrateur
- **Email**: `superadmin@ci-mandat.com`
- **Mot de passe**: `SuperAdmin123!`
- **Permissions**: Accès complet à toutes les fonctionnalités

### Administrateur
- **Email**: `admin@ci-mandat.com`
- **Mot de passe**: `Admin123!`
- **Permissions**: Gestion des mandats et utilisateurs

### Clients
- **Client 1**: `client1@example.com` / `Client123!`
- **Client 2**: `client2@example.com` / `Client123!`

## 🗄️ Structure de la Base de Données

### Tables Principales

- **`users`**: Gestion des utilisateurs et rôles
- **`mandates`**: Stockage des mandats et workflow de validation
- **`audit_logs`**: Journalisation de toutes les actions
- **`sessions`**: Gestion des sessions sécurisées
- **`security_events`**: Événements de sécurité
- **`email_templates`**: Templates d'emails
- **`email_logs`**: Suivi des envois d'emails

### Workflow des Mandats

1. **Création** → `draft`
2. **Soumission** → `pending_validation`
3. **Validation Admin** → `admin_approved`
4. **Validation Super Admin** → `super_admin_approved`
5. **Génération PDF** → `completed`

## 🔧 Configuration Avancée

### Variables d'Environnement Clés

```env
# Authentification
JWT_ACCESS_SECRET=votre_cle_secrete_32_caracteres
JWT_REFRESH_SECRET=votre_cle_refresh_32_caracteres

# Base de données
DATABASE_URL=postgresql://user:pass@host:5432/db

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=votre_email@gmail.com
SMTP_PASS=votre_mot_de_passe_application

# Sécurité
ALLOWED_ORIGINS=http://localhost:3000,https://votredomaine.com
```

### Commandes Utiles

```bash
# Base de données
docker-compose exec postgres psql -U ci_mandat_user -d ci_mandat_db

# Migrations (si utilisées)
cd backend && npm run migration:run

# Tests
npm run test
npm run test:e2e

# Construction
npm run build
```

## 🛠️ Développement

### Structure du Projet

```
ci_mandat/
├── backend/                 # API NestJS
│   ├── src/
│   │   ├── entities/        # Modèles de données
│   │   ├── modules/         # Modules fonctionnels
│   │   ├── common/          # Utilitaires partagés
│   │   └── config/          # Configuration
├── database/               # Scripts SQL
├── src/                    # Frontend Next.js existant
└── docker-compose.yml      # Configuration Docker
```

### Ajout de Nouvelles Fonctionnalités

1. **Nouvelle entité** : Créer dans `backend/src/entities/`
2. **Nouveau module** : Créer dans `backend/src/modules/`
3. **Migration DB** : Utiliser TypeORM migrations
4. **Tests** : Ajouter dans le dossier correspondant

## 🔒 Sécurité

L'application inclut :

- **JWT** avec tokens de rafraîchissement
- **2FA** (Authentification à deux facteurs)
- **Rate Limiting** avancé
- **Chiffrement** des données sensibles
- **Audit** complet des actions
- **Validation** stricte des entrées

## 🚨 Dépannage

### Problèmes Courants

1. **Port déjà utilisé** : Modifier les ports dans `docker-compose.yml`
2. **Connexion DB échouée** : Vérifier `DATABASE_URL` dans `.env`
3. **Erreurs CORS** : Vérifier `ALLOWED_ORIGINS`
4. **JWT invalide** : Régénérer les secrets JWT

### Logs et Debug

```bash
# Voir tous les logs
docker-compose logs

# Logs spécifiques au backend
docker-compose logs backend -f

# Shell dans un container
docker-compose exec backend sh
```

## � Support

Pour toute question ou problème :

1. Consulter les logs avec `docker-compose logs`
2. Vérifier la documentation API sur `/api/docs`
3. Vérifier la configuration des variables d'environnement

---

**Note** : Ce guide suppose une configuration de développement. Pour la production, des ajustements de sécurité supplémentaires sont nécessaires.
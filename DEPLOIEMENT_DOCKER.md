# Déploiement Docker CI-Mandat

Ce document décrit la procédure complète pour déployer l'application CI-Mandat sur le serveur `164.160.40.182` en utilisant Docker.

## 📋 Prérequis

- **Docker** (version 20.10+)
- **Docker Compose** (version 1.29+)
- **Accès SSH** au serveur `164.160.40.182`

## 🗂️ Structure des Fichiers Docker

```
ci_mandat/
├── Dockerfile.frontend          # Frontend Next.js
├── backend/Dockerfile           # Backend NestJS
├── docker-compose.production.yml # Configuration production
├── .env.production              # Variables d'environnement
├── deploy.sh                    # Script de déploiement
├── database/
│   ├── schema.sql              # Schéma de base de données
│   └── seed.sql                # Données initiales
└── DOCKER_DEPLOIEMENT_PRODUCTION.md # Documentation
```

## 🔒 Sécurité de la Base de Données

**IMPORTANT** : La base de données PostgreSQL est configurée pour n'être accessible qu'en local :
- Port 5432 exposé uniquement sur `127.0.0.1`
- Authentification forte avec mots de passe complexes
- Réseau Docker interne isolé

## 🚀 Procédure de Déploiement

### 1. Préparation du Serveur

```bash
# Se connecter au serveur
ssh root@164.160.40.182

# Installer Docker (si nécessaire)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Installer Docker Compose (si nécessaire)
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Déploiement de l'Application

```bash
# Cloner ou copier le projet sur le serveur
git clone <repository> /opt/ci-mandat
cd /opt/ci-mandat

# OU copier les fichiers manuellement via SCP
scp -r ./ root@164.160.40.182:/opt/ci-mandat/

# Se rendre dans le répertoire
cd /opt/ci-mandat

# Rendre le script exécutable (déjà fait)
chmod +x deploy.sh

# Déployer l'application
./deploy.sh --build
```

### 3. Vérification du Déploiement

```bash
# Vérifier l'état des services
./deploy.sh --status

# Afficher les logs
./deploy.sh --logs

# Tester l'application
curl http://164.160.40.182:3000
curl http://164.160.40.182:3001/api/v1/health
```

## ⚙️ Gestion des Services

### Commandes Utiles

```bash
# Redémarrer les services
./deploy.sh --restart

# Arrêter les services
./deploy.sh --stop

# Afficher les logs en temps réel
./deploy.sh --logs

# Nettoyer les ressources inutilisées
./deploy.sh --cleanup

# Afficher l'aide
./deploy.sh --help
```

### Commandes Docker Directes

```bash
# Voir les conteneurs en cours d'exécution
docker ps

# Voir les logs d'un service spécifique
docker logs ci_mandat_backend_prod -f

# Accéder à un conteneur (pour debug)
docker exec -it ci_mandat_backend_prod sh

# Voir l'utilisation des ressources
docker stats
```

## 🔧 Configuration

### Variables d'Environnement (.env.production)

Avant le premier déploiement, modifiez les valeurs par défaut dans `.env.production` :

```bash
# URLs de l'application
FRONTEND_URL=http://164.160.40.182:3000
BACKEND_URL=http://164.160.40.182:3001

# Sécurité - À MODIFIER IMPÉRATIVEMENT
DB_PASSWORD=votre_mot_de_passe_postgresql_sécurisé
JWT_ACCESS_SECRET=votre_clé_jwt_access_32_caractères_minimum
JWT_REFRESH_SECRET=votre_clé_jwt_refresh_32_caractères_minimum
ENCRYPTION_KEY=votre_clé_chiffrement_64_caractères_hexa
DATA_ENCRYPTION_IV=votre_iv_chiffrement_32_caractères_hexa
REDIS_PASSWORD=votre_mot_de_passe_redis_sécurisé
```

### Génération Automatique des Secrets

Le script `deploy.sh` peut générer automatiquement des secrets sécurisés :

```bash
# Supprimer les valeurs "ChangeMe" pour forcer la régénération
sed -i 's/ChangeMe_/ChangeMe_/g' .env.production
./deploy.sh --build
```

## 📊 Monitoring et Maintenance

### Sauvegarde des Données

```bash
# Sauvegarder la base de données
docker exec ci_mandat_postgres_prod pg_dump -U ci_mandat_user ci_mandat_db > backup_$(date +%Y%m%d).sql

# Sauvegarder les volumes
tar -czf backup_volumes_$(date +%Y%m%d).tar.gz $(docker volume ls -q | grep ci_mandat)
```

### Mise à Jour

```bash
# Arrêter les services
./deploy.sh --stop

# Mettre à jour le code
git pull origin main

# Redéployer avec nouvelles images
./deploy.sh --build
```

### Nettoyage

```bash
# Nettoyer les images et conteneurs inutilisés
./deploy.sh --cleanup

# Voir l'espace disque utilisé par Docker
docker system df
```

## 🛠️ Dépannage

### Problèmes Courants

1. **Ports déjà utilisés** : Vérifier qu'aucun service n'utilise les ports 3000, 3001, 5432, 6379
2. **Problèmes de permissions** : Vérifier les permissions des volumes Docker
3. **Erreurs de connexion base de données** : Vérifier les variables d'environnement
4. **Health checks échouent** : Attendre que les services soient complètement démarrés

### Commandes de Diagnostic

```bash
# Vérifier les logs de tous les services
docker-compose -f docker-compose.production.yml logs

# Vérifier l'état des health checks
docker inspect ci_mandat_backend_prod | jq '.[].State.Health'

# Tester la connexion à la base de données
docker exec ci_mandat_postgres_prod pg_isready -U ci_mandat_user -d ci_mandat_db

# Vérifier l'espace disque
df -h /var/lib/docker/
```

## 🔗 URLs de l'Application

- **Frontend** : http://164.160.40.182:3000
- **Backend API** : http://164.160.40.182:3001
- **Documentation API** : http://164.160.40.182:3001/api/docs
- **Health Check** : http://164.160.40.182:3001/api/v1/health

## 📞 Support

En cas de problème, vérifiez :
1. Les logs avec `./deploy.sh --logs`
2. L'état des services avec `./deploy.sh --status`
3. La configuration dans `.env.production`
4. Les ports ouverts sur le serveur

---

**Note** : Pour une sécurité maximale, envisagez d'ajouter un reverse proxy (nginx) avec HTTPS et un pare-feu approprié.
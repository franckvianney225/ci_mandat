# Guide de Déploiement Optimisé CI-Mandat

## 📋 Vue d'Ensemble

Ce guide décrit la procédure de déploiement optimisée de l'application CI-Mandat avec les améliorations de sécurité, performance et monitoring.

## 🎯 Architecture Optimisée

### Services Déployés

```
CI-Mandat Production Optimisé
├── 🔒 Nginx (Reverse Proxy + HTTPS)
├── 🎨 Frontend Next.js (:3000)
├── ⚙️ Backend NestJS (:3001)
├── 🗄️ PostgreSQL (:5432 - local seulement)
├── ⚡ Redis (:6379 - local seulement)
└── 📊 Monitoring (logs centralisés)
```

### Améliorations Principales

- **Sécurité** : HTTPS, secrets sécurisés, rate limiting
- **Performance** : Optimisation PostgreSQL/Redis, compression
- **Monitoring** : Health checks, logs structurés, métriques
- **Résilience** : Restart automatique, limites de ressources

## 🚀 Procédure de Déploiement

### Prérequis

- Docker et Docker Compose installés
- Accès au serveur de production
- Domaine configuré (pour HTTPS)

### Étape 1: Préparation

```bash
# Cloner ou mettre à jour le code
git clone <repository>
cd ci_mandat

# Rendre les scripts exécutables
chmod +x scripts/generate-secrets.sh
chmod +x deploy-optimized.sh
```

### Étape 2: Configuration des Variables d'Environnement

```bash
# Copier le template si nécessaire
cp .env.production.example .env.production

# Générer des secrets sécurisés
./scripts/generate-secrets.sh --force
```

### Étape 3: Configuration SSL (Optionnel mais Recommandé)

```bash
# Créer le dossier pour les certificats
mkdir -p nginx/ssl

# Générer des certificats auto-signés pour test
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=FR/ST=Paris/L=Paris/O=CI-Mandat/CN=ci-mandat.ci"
```

**Pour la production, utilisez Let's Encrypt :**
```bash
# Installer certbot
sudo apt install certbot

# Générer des certificats
sudo certbot certonly --standalone -d votre-domaine.ci
```

### Étape 4: Déploiement

```bash
# Déploiement complet avec construction
./deploy-optimized.sh --build

# Ou déploiement simple (si images existent)
./deploy-optimized.sh
```

### Étape 5: Vérification

```bash
# Vérifier l'état des services
./deploy-optimized.sh --status

# Tester l'accessibilité
./deploy-optimized.sh --test

# Vérifier les logs
./deploy-optimized.sh --logs
```

## 🔧 Configuration Avancée

### Variables d'Environnement Clés

```env
# URLs (à adapter)
FRONTEND_URL=https://votre-domaine.ci
BACKEND_URL=https://votre-domaine.ci
ALLOWED_ORIGINS=https://votre-domaine.ci

# Base de données
DB_PASSWORD=<généré-automatiquement>

# Sécurité
JWT_ACCESS_SECRET=<généré-automatiquement>
JWT_REFRESH_SECRET=<généré-automatiquement>
ENCRYPTION_KEY=<généré-automatiquement>

# Redis
REDIS_PASSWORD=<généré-automatiquement>
```

### Optimisations PostgreSQL

- **Mémoire partagée** : 512MB → 1GB si RAM disponible
- **Connexions max** : 200 → 500 pour charge élevée
- **Cache effectif** : 2GB → 4GB si RAM disponible

### Configuration Redis

- **Mémoire max** : 1GB
- **Politique** : LRU (Least Recently Used)
- **Persistance** : RDB + AOF activés

## 📊 Monitoring et Maintenance

### Vérification de l'État

```bash
# Statut des services
docker ps

# Utilisation des ressources
docker stats

# Logs en temps réel
docker-compose -f docker-compose.production.optimized.yml logs -f
```

### Health Checks

- **Frontend** : `http://localhost:3000`
- **Backend** : `http://localhost:3001/api/v1/health`
- **Nginx** : `http://localhost/health`

### Sauvegarde des Données

```bash
# Sauvegarde PostgreSQL
docker exec ci_mandat_postgres_prod pg_dump -U ci_mandat_user ci_mandat_db > backup_$(date +%Y%m%d).sql

# Sauvegarde Redis
docker exec ci_mandat_redis_prod redis-cli --rdb - > redis_backup_$(date +%Y%m%d).rdb
```

## 🔒 Sécurité

### Bonnes Pratiques Implémentées

1. **Secrets sécurisés** : Génération automatique avec rotation
2. **HTTPS obligatoire** : Redirection HTTP → HTTPS
3. **Rate limiting** : Protection contre les attaques brute force
4. **Headers de sécurité** : HSTS, XSS, Clickjacking
5. **Isolation réseau** : Services internes non exposés

### Configuration Firewall Recommandée

```bash
# Ouvrir uniquement les ports nécessaires
sudo ufw allow 80/tcp    # HTTP (redirection)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## 🛠️ Dépannage

### Problèmes Courants

**Service non accessible :**
```bash
# Vérifier les logs
./deploy-optimized.sh --logs

# Redémarrer les services
./deploy-optimized.sh --restart
```

**Erreur de base de données :**
```bash
# Vérifier la connexion PostgreSQL
docker exec -it ci_mandat_postgres_prod psql -U ci_mandat_user -d ci_mandat_db
```

**Problème de mémoire :**
```bash
# Ajuster les limites dans docker-compose.production.optimized.yml
deploy:
  resources:
    limits:
      memory: 1G  # Augmenter si nécessaire
```

### Commandes Utiles

```bash
# Arrêt complet
./deploy-optimized.sh --stop

# Nettoyage
./deploy-optimized.sh --cleanup

# Reconstruction complète
./deploy-optimized.sh --build
```

## 📈 Scaling et Haute Disponibilité

### Pour la Montée en Charge

1. **Augmenter les ressources** :
   - PostgreSQL : `shared_buffers`, `max_connections`
   - Redis : `maxmemory`
   - Backend : répliques horizontales

2. **Ajouter un load balancer** :
   - Nginx avec plusieurs instances backend
   - Redis en mode cluster

3. **Monitoring avancé** :
   - Prometheus + Grafana
   - Alerting sur les métriques

## 🔄 Mises à Jour

### Procédure de Mise à Jour

```bash
# 1. Arrêter les services
./deploy-optimized.sh --stop

# 2. Mettre à jour le code
git pull origin main

# 3. Régénérer les secrets si nécessaire
./scripts/generate-secrets.sh

# 4. Redéployer
./deploy-optimized.sh --build

# 5. Vérifier
./deploy-optimized.sh --test
```

## 📞 Support

En cas de problème :

1. Consulter les logs : `./deploy-optimized.sh --logs`
2. Vérifier l'état : `./deploy-optimized.sh --status`
3. Tester les services : `./deploy-optimized.sh --test`

---

**⚠️ Important** : Ce déploiement est optimisé pour la production. Testez toujours en environnement de staging avant de déployer en production.
# Déploiement Rapide CI-Mandat - Version Corrigée

## Problèmes Résolus

### 1. Variables d'environnement
- Les variables n'étaient pas chargées correctement par Docker Compose
- Le script ne spécifiait pas le fichier `.env.production`

### 2. Conflit de réseau Docker
- Le sous-réseau `172.20.0.0/16` était en conflit avec un autre réseau
- Configuration IPAM supprimée pour laisser Docker gérer automatiquement

### 3. Téléchargement Puppeteer
- `html-pdf-node` essayait de télécharger Chromium et échouait
- Configuration pour utiliser Chromium système à la place

### 4. Erreur TypeScript Redis
- Propriétés invalides `retryDelayOnFailover` et `maxRetriesPerRequest`
- Configuration Redis simplifiée avec propriétés valides

## Corrections Appliquées

✅ **Script de déploiement corrigé** ([`deploy.sh`](deploy.sh)) :
- Utilise `--env-file "$ENV_FILE"` pour toutes les commandes Docker Compose
- Charge automatiquement les variables d'environnement
- Nouvelle option `--cleanup-networks` pour résoudre les conflits

✅ **Fichier d'environnement sécurisé** ([`.env.production`](.env.production)) :
- Toutes les valeurs "ChangeMe" remplacées par des valeurs sécurisées
- Prêt pour le déploiement

✅ **Configuration réseau corrigée** ([`docker-compose.production.yml`](docker-compose.production.yml)) :
- Suppression de la configuration IPAM fixe
- Docker gère automatiquement le sous-réseau

✅ **Dockerfile Backend corrigé** ([`backend/Dockerfile`](backend/Dockerfile)) :
- Variables Puppeteer définies AVANT l'installation des dépendances
- Utilisation de `npm ci --ignore-scripts` pour éviter les scripts de téléchargement
- Configuration Chromium système

✅ **Service Redis corrigé** ([`backend/src/modules/redis/redis.service.ts`](backend/src/modules/redis/redis.service.ts)) :
- Propriétés Redis valides : `retryDelay` au lieu de `retryDelayOnFailover`
- Suppression de `maxRetriesPerRequest` non supporté

## Instructions de Déploiement

### 1. Rendre le script exécutable
```bash
chmod +x deploy.sh
```

### 2. Nettoyer les anciens réseaux (si conflit persiste)
```bash
./deploy.sh --cleanup-networks
```

### 3. Déployer avec les corrections
```bash
./deploy.sh --build
```

### 4. Vérifier le déploiement
```bash
./deploy.sh --status
./deploy.sh --test
```

## Résultat Attendu

Le déploiement devrait maintenant fonctionner sans erreur :
- ✅ Installation des dépendances sans téléchargement Puppeteer
- ✅ Compilation TypeScript réussie
- ✅ Création du réseau Docker sans conflit
- ✅ Démarrage de tous les services
- ✅ Génération de PDFs avec Chromium système

## Ce qui a été amélioré

- **Dockerfiles** : Build TypeScript corrigé, Puppeteer configuré
- **Script de déploiement** : Chargement correct des variables d'environnement
- **Sécurité** : Mots de passe et clés sécurisés
- **Health checks** : Endpoints corrigés et délais adaptés

## Résultat Attendu

Le déploiement devrait maintenant fonctionner sans les warnings "variable is not set" et démarrer correctement tous les services :
- ✅ Frontend sur le port 3000
- ✅ Backend sur le port 3001  
- ✅ Base de données PostgreSQL
- ✅ Cache Redis
- ✅ Génération de PDFs avec Puppeteer

Si vous rencontrez encore des problèmes, consultez les logs avec :
```bash
./deploy.sh --logs
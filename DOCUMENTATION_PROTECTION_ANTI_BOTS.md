# Documentation - Protection Anti-Bots CI-Mandat

## Vue d'ensemble

La protection anti-bots de l'application CI-Mandat combine deux technologies principales :
- **reCAPTCHA v3** : Protection invisible contre les bots
- **Rate Limiting** : Limitation du nombre de requêtes par IP

## Composants implémentés

### 1. reCAPTCHA v3 côté Frontend

**Fichiers modifiés :**
- `src/app/page.tsx` - Formulaire principal avec intégration reCAPTCHA
- `src/lib/api.ts` - Client API modifié pour envoyer le token reCAPTCHA

**Fonctionnalités :**
- Génération automatique du token reCAPTCHA lors de la soumission
- Envoi du token dans l'en-tête `X-Recaptcha-Token`
- Indicateurs visuels d'erreur pour chaque champ
- Gestion des erreurs détaillées

### 2. reCAPTCHA v3 côté Backend

**Fichiers créés/modifiés :**
- `backend/src/modules/security/recaptcha.service.ts` - Service de vérification
- `backend/src/modules/mandates/mandates.controller.ts` - Intégration dans l'API
- `backend/src/modules/mandates/mandates.module.ts` - Configuration du module
- `backend/.env` - Ajout de la clé secrète reCAPTCHA

**Fonctionnalités :**
- Vérification du token avec l'API Google
- Score minimum de 0.5 pour considérer comme humain
- Vérification de l'action attendue (`mandate_submission`)
- Gestion des erreurs avec fallback (acceptation par défaut en cas d'erreur réseau)

### 3. Rate Limiting côté Backend

**Fichiers modifiés :**
- `backend/src/app.module.ts` - Configuration globale du rate limiting
- `backend/src/modules/mandates/mandates.controller.ts` - Limite spécifique pour la création de mandat

**Limites configurées :**
- **Global** : 100 requêtes par minute
- **Création de mandat** : 5 requêtes par minute par IP
- **Authentification** : 10 tentatives par minute

## Comment tester la protection

### Test 1 : Formulaire Frontend

1. Ouvrez l'application dans le navigateur : `http://localhost:3000`
2. Remplissez le formulaire de demande de mandat
3. Soumettez le formulaire
4. **Vérifiez** : Le badge reCAPTCHA doit apparaître en bas à droite
5. **Vérifiez** : La requête doit contenir l'en-tête `X-Recaptcha-Token`

### Test 2 : Vérification Backend

1. Démarrez le backend : `cd backend && npm run start:dev`
2. **Vérifiez** que le backend démarre correctement :
   ```
   🚀 Application démarrée sur le port 3001
   📚 Documentation API disponible sur: http://localhost:3001/api/docs
   🌍 Environnement: development
   ```
3. Vérifiez les logs de démarrage :
   ```
   [Nest] XXX  - XX/XX/XXXX, XX:XX:XX XX   LOG [RecaptchaService] Vérification reCAPTCHA configurée
   [Nest] XXX  - XX/XX/XXXX, XX:XX:XX XX   LOG [ThrottlerStorage] Rate limiting configuré
   ```

### Test 3 : Test API Direct

Avec curl ou Postman :

```bash
# Test sans token reCAPTCHA (doit échouer)
curl -X POST http://localhost:3001/mandates \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Test",
    "prenom": "User",
    "fonction": "Testeur",
    "email": "test@example.com",
    "telephone": "0123456789",
    "circonscription": "Abidjan-Plateau"
  }'

# Test avec token reCAPTCHA valide
curl -X POST http://localhost:3001/mandates \
  -H "Content-Type: application/json" \
  -H "X-Recaptcha-Token: VOTRE_TOKEN_RECAPTCHA_VALIDE" \
  -d '{
    "nom": "Test",
    "prenom": "User",
    "fonction": "Testeur",
    "email": "test@example.com",
    "telephone": "0123456789",
    "circonscription": "Abidjan-Plateau"
  }'
```

### Test 4 : Test Rate Limiting

1. Envoyez 6 requêtes de création de mandat en moins d'une minute
2. **Vérifiez** : La 6ème requête doit retourner une erreur 429 (Too Many Requests)

### Test 5 : Test des indicateurs d'erreur

1. Soumettez le formulaire avec des données invalides
2. **Vérifiez** : Les champs en erreur doivent avoir des bordures rouges
3. **Vérifiez** : Les messages d'erreur doivent s'afficher sous chaque champ
4. **Vérifiez** : Les icônes d'erreur doivent apparaître à côté des labels

## Configuration reCAPTCHA

### Clés utilisées (développement) :
- **Site Key** : `6LfY8cMpAAAAAAG8vQJQ9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9` (dans `.env.local`)
- **Secret Key** : `6LfY8cMpAAAAAG8vQJQ9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9` (dans `backend/.env`)

### Pour la production :
1. Créez des clés reCAPTCHA v3 sur [Google reCAPTCHA](https://www.google.com/recaptcha/admin)
2. Mettez à jour les variables d'environnement
3. Ajoutez votre domaine à la liste des domaines autorisés

## Dépannage

### Problème : reCAPTCHA ne se charge pas
**Solution :** Vérifiez que la clé site est correcte dans `.env.local`

### Problème : Erreur de vérification reCAPTCHA
**Solution :** Vérifiez que la clé secrète est correcte dans `backend/.env`

### Problème : Rate limiting trop strict
**Solution :** Ajustez les limites dans `backend/src/app.module.ts`

### Problème : Erreurs TypeScript
**Solution :** Vérifiez que tous les imports sont corrects et que le code compile

### Problème : Erreur "Network error occurred"
**Solution :** Vérifiez que le backend est démarré :
```bash
cd backend
npm run start:dev
```

**Vérifiez que :**
- Le backend écoute sur le port 3001
- L'URL `http://localhost:3001/api/v1` est accessible
- Aucun autre service n'utilise le port 3001

## Sécurité

### Points forts :
- Protection invisible pour les utilisateurs légitimes
- Score de confiance basé sur le comportement
- Limitation des abus par IP
- Validation côté serveur robuste

### Limitations connues :
- En développement, reCAPTCHA peut accepter les requêtes même en cas d'erreur
- Le rate limiting utilise l'IP, ce qui peut affecter les utilisateurs partageant une IP

## Maintenance

### Mise à jour des clés :
1. Générer de nouvelles clés sur le console Google reCAPTCHA
2. Mettre à jour les variables d'environnement
3. Redémarrer l'application

### Surveillance :
- Surveiller les logs pour détecter les tentatives d'abus
- Ajuster les limites de rate limiting selon l'usage
- Vérifier périodiquement les scores reCAPTCHA moyens

Cette documentation vous permet de comprendre, tester et maintenir la protection anti-bots de votre application CI-Mandat.
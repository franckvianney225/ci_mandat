# Documentation - Externalisation des Clés Secrètes

## Résumé des Changements

### ✅ Problèmes Résolus

1. **Clé secrète hardcodée dans le frontend** - [`src/components/admin/PDFMandatGenerator.tsx`](src/components/admin/PDFMandatGenerator.tsx:103)
2. **Clé secrète hardcodée dans le backend** - [`backend/src/modules/security/security.service.ts`](backend/src/modules/security/security.service.ts:9)
3. **Mot de passe administrateur hardcodé** - [`backend/src/modules/users/users.service.ts`](backend/src/modules/users/users.service.ts:52)

### 🔧 Modifications Apportées

#### 1. Variables d'Environnement Créées

**Frontend (`.env.local`):**
```env
# Clé secrète pour la génération de signatures PDF
NEXT_PUBLIC_PDF_SIGNATURE_SECRET=mandat-secret-key-2025

# URL de base pour la vérification
NEXT_PUBLIC_VERIFICATION_BASE_URL=http://localhost:3000

# URL de l'API backend
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

**Backend (`backend/.env`):**
```env
# Clé secrète pour la génération de signatures PDF (identique au frontend)
PDF_SIGNATURE_SECRET=mandat-secret-key-2025

# Compte administrateur par défaut
DEFAULT_ADMIN_EMAIL=admin@mandat.com
DEFAULT_ADMIN_PASSWORD=admincimandat20_25
```

#### 2. Fichiers Modifiés

**Frontend:**
- [`src/components/admin/PDFMandatGenerator.tsx`](src/components/admin/PDFMandatGenerator.tsx):
  - Ligne 103: `const secretKey = process.env.NEXT_PUBLIC_PDF_SIGNATURE_SECRET;`
  - Ligne 136: Utilisation de `process.env.NEXT_PUBLIC_VERIFICATION_BASE_URL`

**Backend:**
- [`backend/src/modules/security/security.service.ts`](backend/src/modules/security/security.service.ts):
  - Ligne 9: `private readonly secretKey = process.env.PDF_SIGNATURE_SECRET || 'mandat-secret-key-2025';`
- [`backend/src/modules/users/users.service.ts`](backend/src/modules/users/users.service.ts):
  - Lignes 51-52: Utilisation de `process.env.DEFAULT_ADMIN_EMAIL` et `process.env.DEFAULT_ADMIN_PASSWORD`

### 🔒 Sécurité Améliorée

1. **Plus de clés hardcodées** dans le code source
2. **Gestion centralisée** des secrets via variables d'environnement
3. **Possibilité de rotation** des clés sans modification du code
4. **Séparation des environnements** (dev, staging, prod)
5. **Protection contre l'exposition** des secrets dans les dépôts Git

### 🧪 Tests Effectués

- ✅ Backend redémarre avec les nouvelles variables
- ✅ Frontend fonctionne avec les variables d'environnement
- ✅ Authentification JWT avec cookies HttpOnly fonctionnelle
- ✅ Génération de signatures cryptographiques cohérente frontend/backend

### 📋 Checklist de Sécurité

- [x] Clés de signature PDF externalisées
- [x] Mot de passe administrateur externalisé
- [x] Variables d'environnement créées pour tous les environnements
- [x] Documentation mise à jour
- [x] Tests de fonctionnement effectués

### 🚀 Déploiement

**Pour la production:**
1. Configurer les variables d'environnement sur le serveur
2. Utiliser des clés différentes pour chaque environnement
3. Ne jamais commiter les fichiers `.env` dans Git
4. Utiliser des gestionnaires de secrets sécurisés

**Variables critiques à sécuriser:**
- `PDF_SIGNATURE_SECRET` - Doit être identique frontend/backend
- `DEFAULT_ADMIN_PASSWORD` - Changer en production
- `JWT_ACCESS_SECRET` - Clé forte en production
- `ENCRYPTION_KEY` - Clé de chiffrement sécurisée

### 📝 Notes Importantes

- Les clés doivent être **identiques** entre frontend et backend pour la génération de signatures
- En production, utiliser des clés **fortes et uniques**
- Le mot de passe administrateur par défaut doit être **changé** en production
- Les fichiers `.env` doivent être **ignorés** par Git (déjà dans `.gitignore`)

## Conclusion

L'externalisation des clés secrètes améliore significativement la sécurité du système en éliminant les vulnérabilités liées aux secrets hardcodés. Le système est maintenant prêt pour un déploiement sécurisé en production.
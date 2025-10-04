# Plan d'Externalisation des Clés Secrètes

## Problème Identifié
**Clé secrète hardcodée** dans [`src/components/admin/PDFMandatGenerator.tsx`](src/components/admin/PDFMandatGenerator.tsx:103):
```typescript
const secretKey = 'mandat-secret-key-2025';
```

Cette clé est utilisée pour générer des signatures cryptographiques pour les QR codes de vérification.

## Solution Proposée

### 1. Variables d'Environnement à Créer

**Fichier `.env.local` (Next.js):**
```
# Clé secrète pour la génération de signatures PDF
NEXT_PUBLIC_PDF_SIGNATURE_SECRET=mandat-secret-key-2025

# URL de base pour la vérification
NEXT_PUBLIC_VERIFICATION_BASE_URL=http://localhost:3000
```

**Fichier `backend/.env` (NestJS):**
```
# Clé secrète pour la génération de signatures PDF (identique au frontend)
PDF_SIGNATURE_SECRET=mandat-secret-key-2025
```

### 2. Modifications à Apporter

#### Frontend (Next.js)
- **Fichier:** [`src/components/admin/PDFMandatGenerator.tsx`](src/components/admin/PDFMandatGenerator.tsx)
- **Ligne 103:** Remplacer la clé hardcodée par `process.env.NEXT_PUBLIC_PDF_SIGNATURE_SECRET`
- **Ligne 136:** Utiliser `process.env.NEXT_PUBLIC_VERIFICATION_BASE_URL` pour l'URL de base

#### Backend (NestJS)
- **Fichier:** [`backend/src/modules/security/security.service.ts`](backend/src/modules/security/security.service.ts)
- Vérifier si la même clé est utilisée côté backend et l'externaliser également

### 3. Vérification des Autres Clés Hardcodées
Rechercher dans le codebase d'autres occurrences de clés secrètes:
- Clés JWT
- Clés de chiffrement
- Clés API
- Mots de passe par défaut

### 4. Tests à Effectuer
- Génération de PDF avec signature
- Vérification des QR codes
- Compatibilité frontend/backend

## Étapes d'Implémentation

1. ✅ Analyser le problème
2. 🔄 Créer les variables d'environnement
3. 🔄 Mettre à jour le code frontend
4. 🔄 Mettre à jour le code backend
5. 🔄 Vérifier d'autres clés hardcodées
6. 🔄 Tester l'ensemble du système
7. 🔄 Documenter les changements

## Sécurité Améliorée
- Les clés ne sont plus exposées dans le code source
- Gestion centralisée des secrets
- Possibilité de rotation des clés sans modification du code
- Séparation des environnements (dev, staging, prod)
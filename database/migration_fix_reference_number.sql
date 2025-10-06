-- Migration pour résoudre le problème de la colonne reference_number
-- Cette migration doit être exécutée avant que TypeORM ne tente de synchroniser le schéma

-- Étape 1: Ajouter la colonne reference_number sans contrainte NOT NULL
ALTER TABLE mandates ADD COLUMN reference_number_temp VARCHAR(50);

-- Étape 2: Générer des numéros de référence pour les enregistrements existants
UPDATE mandates 
SET reference_number_temp = 'MND-' || 
    SUBSTRING(CAST(EXTRACT(EPOCH FROM created_at) * 1000 AS VARCHAR) FROM 9 FOR 8) || 
    '-' || 
    UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4))
WHERE reference_number_temp IS NULL;

-- Étape 3: Vérifier qu'il n'y a pas de doublons
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT reference_number_temp, COUNT(*)
        FROM mandates
        GROUP BY reference_number_temp
        HAVING COUNT(*) > 1
    ) AS duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE EXCEPTION 'Des numéros de référence en double ont été générés. Veuillez réexécuter la migration.';
    END IF;
END $$;

-- Étape 4: Supprimer l'ancienne colonne si elle existe
ALTER TABLE mandates DROP COLUMN IF EXISTS reference_number;

-- Étape 5: Renommer la colonne temporaire
ALTER TABLE mandates RENAME COLUMN reference_number_temp TO reference_number;

-- Étape 6: Ajouter la contrainte UNIQUE et NOT NULL
ALTER TABLE mandates ALTER COLUMN reference_number SET NOT NULL;
ALTER TABLE mandates ADD CONSTRAINT mandates_reference_number_unique UNIQUE (reference_number);

-- Étape 7: Créer l'index
CREATE INDEX IF NOT EXISTS idx_mandates_reference_number ON mandates(reference_number);

-- Message de confirmation
SELECT 'Migration reference_number terminée avec succès!' as message;
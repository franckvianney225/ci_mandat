-- Migration pour corriger les valeurs NULL dans referenceNumber
-- Cette migration met à jour tous les enregistrements qui n'ont pas de referenceNumber

-- Étape 1: Vérifier combien d'enregistrements ont des valeurs NULL
SELECT COUNT(*) as mandates_with_null_reference 
FROM mandates 
WHERE "referenceNumber" IS NULL OR "referenceNumber" = '';

-- Étape 2: Générer des numéros de référence pour les enregistrements NULL
UPDATE mandates 
SET "referenceNumber" = 'MND-' || 
    SUBSTRING(CAST(EXTRACT(EPOCH FROM "createdAt") * 1000 AS VARCHAR) FROM 9 FOR 8) || 
    '-' || 
    UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4))
WHERE "referenceNumber" IS NULL OR "referenceNumber" = '';

-- Étape 3: Vérifier qu'il n'y a pas de doublons après la mise à jour
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT "referenceNumber", COUNT(*)
        FROM mandates
        GROUP BY "referenceNumber"
        HAVING COUNT(*) > 1
    ) AS duplicates;
    
    IF duplicate_count > 0 THEN
        -- Si des doublons existent, régénérer les numéros pour ces enregistrements
        UPDATE mandates 
        SET "referenceNumber" = 'MND-' || 
            SUBSTRING(CAST(EXTRACT(EPOCH FROM "createdAt") * 1000 AS VARCHAR) FROM 9 FOR 8) || 
            '-' || 
            UPPER(SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT) FROM 1 FOR 4))
        WHERE id IN (
            SELECT m1.id
            FROM mandates m1
            JOIN (
                SELECT "referenceNumber", COUNT(*)
                FROM mandates
                GROUP BY "referenceNumber"
                HAVING COUNT(*) > 1
            ) m2 ON m1."referenceNumber" = m2."referenceNumber"
        );
    END IF;
END $$;

-- Étape 4: Vérifier que tous les enregistrements ont maintenant un referenceNumber
SELECT COUNT(*) as mandates_with_null_reference_after_fix
FROM mandates 
WHERE "referenceNumber" IS NULL OR "referenceNumber" = '';

-- Message de confirmation
SELECT 'Migration referenceNumber NULL values fix terminée avec succès!' as message;
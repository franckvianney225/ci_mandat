-- Migration pour renommer la colonne referenceNumber en reference_number
-- pour correspondre au mapping TypeORM

-- Étape 1: Vérifier si la colonne reference_number existe déjà
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'mandates' AND column_name = 'reference_number';

-- Étape 2: Renommer la colonne referenceNumber en reference_number
ALTER TABLE mandates RENAME COLUMN "referenceNumber" TO reference_number;

-- Étape 3: Vérifier que le renommage a fonctionné
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'mandates' AND column_name IN ('reference_number', 'referenceNumber');

-- Étape 4: Vérifier que les contraintes sont toujours présentes
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'mandates' AND constraint_type = 'UNIQUE';

-- Message de confirmation
SELECT 'Colonne reference_number renommée avec succès!' as message;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtenir __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Convertir le logo PNG en base64
const logoPath = path.join(__dirname, 'public', 'logorhdp.png');
const outputPath = path.join(__dirname, 'src', 'static', 'logo_base64.txt');

try {
  // Lire le fichier image
  const logoBuffer = fs.readFileSync(logoPath);
  
  // Convertir en base64
  const base64String = logoBuffer.toString('base64');
  
  // Créer le format base64 pour l'image
  const base64Image = `data:image/png;base64,${base64String}`;
  
  // Sauvegarder dans un fichier texte
  fs.writeFileSync(outputPath, base64Image);
  
  console.log('Logo en base64:');
  console.log(base64Image);
  console.log(`\nBase64 sauvegardé dans: ${outputPath}`);
} catch (error) {
  console.error('Erreur lors de la conversion du logo:', error);
}
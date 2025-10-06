import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtenir __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Convertir le logo JPEG en base64
const logoPath = path.join(__dirname, 'src', 'static', 'logorhdp.jpeg');
const outputPath = path.join(__dirname, 'src', 'static', 'logo_base64.txt');

try {
  // Lire le fichier image
  const logoBuffer = fs.readFileSync(logoPath);
  
  // Convertir en base64
  const base64String = logoBuffer.toString('base64');
  
  // Sauvegarder dans un fichier texte
  fs.writeFileSync(outputPath, base64String);
  
  console.log('Logo converti avec succès en base64');
  console.log(`Taille du fichier base64: ${base64String.length} caractères`);
  console.log(`Fichier sauvegardé: ${outputPath}`);
} catch (error) {
  console.error('Erreur lors de la conversion du logo:', error);
}
import fs from 'fs';
import path from 'path';

// Chemin vers le fichier signature.png
const __dirname = path.dirname(new URL(import.meta.url).pathname);
// Décoder le chemin pour gérer les espaces
const decodedDirname = decodeURIComponent(__dirname);
const signaturePath = path.join(decodedDirname, 'public', 'signature.png');

// Lire le fichier et le convertir en base64
fs.readFile(signaturePath, (err, data) => {
  if (err) {
    console.error('Erreur lors de la lecture du fichier:', err);
    return;
  }
  
  // Convertir en base64
  const base64String = data.toString('base64');
  
  // Créer le format base64 pour l'image
  const base64Image = `data:image/png;base64,${base64String}`;
  
  // Afficher le résultat
  console.log('Signature en base64:');
  console.log(base64Image);
  
  // Sauvegarder dans un fichier pour référence
  const outputPath = path.join(decodedDirname, 'src', 'static', 'signature_base64.txt');
  fs.writeFileSync(outputPath, base64Image);
  console.log(`\nBase64 sauvegardé dans: ${outputPath}`);
});
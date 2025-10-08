const bcrypt = require('bcrypt');

async function generateHash() {
  const password = 'admincimandat20_25';
  const hash = await bcrypt.hash(password, 12);
  console.log('Mot de passe:', password);
  console.log('Hash bcrypt:', hash);
  console.log('Longueur du hash:', hash.length);
  
  // Vérifier que le hash correspond au mot de passe
  const isValid = await bcrypt.compare(password, hash);
  console.log('Vérification hash:', isValid);
}

generateHash().catch(console.error);
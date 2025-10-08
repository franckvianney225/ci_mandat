// Script pour générer un hash bcrypt valide en utilisant le backend
// Ce script doit être exécuté DANS le conteneur backend

const bcrypt = require('bcrypt');

async function generateValidHash() {
  const password = 'admincimandat20_25';
  
  console.log('🔑 Génération du hash bcrypt pour:', password);
  console.log('📏 Longueur du mot de passe:', password.length);
  
  // Générer le hash avec 12 rounds (comme dans le backend)
  const hash = await bcrypt.hash(password, 12);
  
  console.log('✅ Hash généré:', hash);
  console.log('📏 Longueur du hash:', hash.length);
  
  // Vérifier que le hash correspond au mot de passe
  const isValid = await bcrypt.compare(password, hash);
  console.log('🔍 Vérification hash/mot de passe:', isValid);
  
  if (isValid) {
    console.log('\n🎉 HASH VALIDE !');
    console.log('📋 Commande SQL à exécuter:');
    console.log(`UPDATE users SET password_hash = '${hash}' WHERE email = 'admin@mandat.com';`);
  } else {
    console.log('\n❌ ERREUR: Le hash ne correspond pas au mot de passe !');
  }
}

generateValidHash().catch(console.error);
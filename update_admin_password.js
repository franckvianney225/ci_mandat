const { Client } = require('pg');

const client = new Client({
  host: 'ci_mandat_postgres_prod',
  port: 5432,
  database: 'ci_mandat_db',
  user: 'ci_mandat_user',
  password: 'CiMandatProd2024SecureDBPass'
});

async function updatePassword() {
  try {
    await client.connect();
    
    // Générer le hash bcrypt
    const bcrypt = require('bcrypt');
    const hash = await bcrypt.hash('admincimandat20_25', 12);
    console.log('Hash généré:', hash);
    console.log('Longueur du hash:', hash.length);
    
    // Mettre à jour la base de données
    const result = await client.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2',
      [hash, 'admin@mandat.com']
    );
    
    console.log('Mise à jour réussie:', result.rowCount, 'ligne(s) affectée(s)');
    
    // Vérifier le hash stocké
    const checkResult = await client.query(
      'SELECT email, LENGTH(password_hash) as hash_length, password_hash FROM users WHERE email = $1',
      ['admin@mandat.com']
    );
    
    console.log('Hash stocké:', checkResult.rows[0].password_hash);
    console.log('Longueur du hash stocké:', checkResult.rows[0].hash_length);
    
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await client.end();
  }
}

updatePassword();
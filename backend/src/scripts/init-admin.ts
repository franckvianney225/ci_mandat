/**
 * Script d'initialisation du compte administrateur
 * S'exécute avant le démarrage de l'application principale
 */

// Configuration simple pour éviter les problèmes d'import
const bcrypt = require('bcrypt');
const { DataSource } = require('typeorm');
const { User, UserRole, UserStatus } = require('../entities/user.entity');

// Configuration de la base de données
const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://ci_mandat_user:CiMandatProd2024SecureDBPass@ci_mandat_postgres_prod:5432/ci_mandat_db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});

async function initAdmin() {
  try {
    console.log('🚀 Initialisation du compte administrateur...');
    
    // Initialiser la connexion à la base de données
    await dataSource.initialize();
    const userRepo = dataSource.getRepository(User);

    // Vérifier s'il existe déjà un admin
    const existingAdmin = await userRepo.findOne({ 
      where: { email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@mandat.com' } 
    });

    if (existingAdmin) {
      console.log('✅ Compte administrateur existe déjà');
      await dataSource.destroy();
      return;
    }

    // Lire les valeurs des variables d'environnement
    const email = process.env.DEFAULT_ADMIN_EMAIL || 'admin@mandat.com';
    const password = process.env.DEFAULT_ADMIN_PASSWORD || 'admincimandat20_25';
    const role = UserRole.SUPER_ADMIN;
    const status = UserStatus.ACTIVE;

    // Hasher le mot de passe (même configuration que dans le service)
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Créer le compte admin
    const adminUser = userRepo.create({
      email,
      passwordHash,
      role,
      status,
      personalData: {
        firstName: 'Administrateur',
        lastName: 'Système',
        phone: '+225 00 00 00 00',
        department: 'Administration'
      }
    });

    await userRepo.save(adminUser);

    console.log('✅ Compte administrateur créé avec succès');
    console.log(`📧 Email: ${email}`);
    console.log('🔑 Mot de passe: [CONFIGURÉ DANS LES VARIABLES D\'ENVIRONNEMENT]');
    console.log(`👤 Rôle: ${role}`);
    console.log(`📊 Statut: ${status}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation du compte administrateur:', error);
    process.exit(1);
  } finally {
    // Fermer la connexion à la base de données
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  initAdmin().catch(console.error);
}

module.exports = { initAdmin };
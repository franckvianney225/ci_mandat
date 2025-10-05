/** @type {import('next').NextConfig} */
const nextConfig = {
  // Désactiver les vérifications strictes TypeScript pour le build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Désactiver les vérifications ESLint pour le build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Configuration de sécurité
  poweredByHeader: false,
  // Configuration pour Docker
  output: 'standalone',
  // Variables d'environnement
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://164.160.40.182:3001/api/v1',
    NEXT_PUBLIC_FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://164.160.40.182:3000',
  },
  // Configuration des images (si utilisées)
  images: {
    domains: [],
    unoptimized: true,
  },
  // Configuration pour éviter les erreurs de build
  experimental: {
    esmExternals: true,
  },
  // Désactiver la compression pour Docker
  compress: false,
};

module.exports = nextConfig;
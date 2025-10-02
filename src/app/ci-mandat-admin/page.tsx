"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";

export default function AdminLogin() {
  const [credentials, setCredentials] = useState({
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Authentification réelle avec l'API backend
      const response = await apiClient.login({
        email: credentials.email,
        password: credentials.password
      });

      console.log('🔑 Réponse API complète:', response);
      console.log('🔑 Success:', response.success);
      console.log('🔑 Data:', response.data);

      if (response.success && response.data) {
        // Stocker le token JWT sécurisé
        localStorage.setItem("adminToken", response.data.access_token);
        console.log('✅ Token stocké, redirection...');
        // Redirection vers le tableau de bord d'administration
        router.push("/ci-mandat-admin/dashboard");
      } else {
        console.log('❌ Échec de la réponse:', response);
        setError("Email ou mot de passe incorrect");
      }
    } catch (err: unknown) {
      console.error("Erreur d'authentification:", err);
      const error = err as { status?: number };
      if (error.status === 401) {
        setError("Email ou mot de passe incorrect");
      } else if (error.status === 403) {
        setError("Compte suspendu ou non autorisé");
      } else {
        setError("Erreur de connexion au serveur. Veuillez réessayer.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* En-tête */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-orange-600 rounded-full flex items-center justify-center">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Connexion Administrateur
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Accédez au panneau d&apos;administration
          </p>
        </div>

        {/* Formulaire de connexion */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={credentials.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 transition-colors"
                placeholder="Entrez votre email"
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 transition-colors"
                placeholder="Entrez votre mot de passe"
              />
            </div>

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connexion en cours...
                </div>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          {/* Note de sécurité */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Cette zone est réservée aux administrateurs autorisés
            </p>
          </div>
        </div>

        {/* Informations de test */}
        <div className="text-center">
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer">Informations de test</summary>
            <div className="mt-2 p-3 bg-gray-100 rounded-lg">
              <p><strong>Email:</strong> admin@mandat.com</p>
              <p><strong>Mot de passe:</strong> admincimandat20_25</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
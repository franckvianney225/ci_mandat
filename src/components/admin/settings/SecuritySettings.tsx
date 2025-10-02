"use client";

import { useState } from "react";

interface SecurityConfig {
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  enable2FA: boolean;
  enableBruteForceProtection: boolean;
  enableIPWhitelist: boolean;
  allowedIPs: string[];
}

export default function SecuritySettings() {
  const [config, setConfig] = useState<SecurityConfig>({
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: false,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    enable2FA: true,
    enableBruteForceProtection: true,
    enableIPWhitelist: false,
    allowedIPs: ["127.0.0.1", "192.168.1.1"],
  });

  const [newIP, setNewIP] = useState("");

  const handleInputChange = (field: keyof SecurityConfig, value: string | boolean | number | string[]) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      // TODO: Implémenter l'appel API pour sauvegarder la configuration
      console.log("Sauvegarde de la configuration sécurité:", config);
      alert("Configuration sécurité sauvegardée avec succès !");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert("Erreur lors de la sauvegarde de la configuration");
    }
  };

  const addIP = () => {
    if (newIP && !config.allowedIPs.includes(newIP)) {
      handleInputChange("allowedIPs", [...config.allowedIPs, newIP]);
      setNewIP("");
    }
  };

  const removeIP = (ipToRemove: string) => {
    handleInputChange("allowedIPs", config.allowedIPs.filter(ip => ip !== ipToRemove));
  };

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-semibold text-gray-900">Paramètres de Sécurité</h2>
        <p className="text-gray-600 mt-1">
          Configurez les paramètres de sécurité de l'application
        </p>
      </div>

      {/* Configuration de sécurité */}
      <div className="space-y-6">
        {/* Politique des mots de passe */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Politique des mots de passe</h3>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Longueur minimale */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longueur minimale du mot de passe
              </label>
              <input
                type="number"
                value={config.passwordMinLength}
                onChange={(e) => handleInputChange("passwordMinLength", parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] text-gray-900 bg-white"
                min="6"
                max="20"
              />
            </div>

            {/* Tentatives de connexion */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tentatives de connexion maximum
              </label>
              <input
                type="number"
                value={config.maxLoginAttempts}
                onChange={(e) => handleInputChange("maxLoginAttempts", parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] text-gray-900 bg-white"
                min="3"
                max="10"
              />
            </div>
          </div>

          {/* Exigences des mots de passe */}
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.passwordRequireUppercase}
                onChange={(e) => handleInputChange("passwordRequireUppercase", e.target.checked)}
                className="h-4 w-4 text-[#FF8200] focus:ring-[#FF8200] border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Exiger au moins une lettre majuscule
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.passwordRequireLowercase}
                onChange={(e) => handleInputChange("passwordRequireLowercase", e.target.checked)}
                className="h-4 w-4 text-[#FF8200] focus:ring-[#FF8200] border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Exiger au moins une lettre minuscule
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.passwordRequireNumbers}
                onChange={(e) => handleInputChange("passwordRequireNumbers", e.target.checked)}
                className="h-4 w-4 text-[#FF8200] focus:ring-[#FF8200] border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Exiger au moins un chiffre
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.passwordRequireSpecialChars}
                onChange={(e) => handleInputChange("passwordRequireSpecialChars", e.target.checked)}
                className="h-4 w-4 text-[#FF8200] focus:ring-[#FF8200] border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Exiger au moins un caractère spécial (!@#$%^&*)
              </span>
            </label>
          </div>
        </div>

        {/* Session et authentification */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Session et Authentification</h3>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Timeout de session */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timeout de session (minutes)
              </label>
              <input
                type="number"
                value={config.sessionTimeout}
                onChange={(e) => handleInputChange("sessionTimeout", parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] text-gray-900 bg-white"
                min="15"
                max="480"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.enable2FA}
                onChange={(e) => handleInputChange("enable2FA", e.target.checked)}
                className="h-4 w-4 text-[#FF8200] focus:ring-[#FF8200] border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Activer l'authentification à deux facteurs (2FA)
                <span className="text-xs text-gray-500 block">
                  Requiert une application d'authentification comme Google Authenticator
                </span>
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.enableBruteForceProtection}
                onChange={(e) => handleInputChange("enableBruteForceProtection", e.target.checked)}
                className="h-4 w-4 text-[#FF8200] focus:ring-[#FF8200] border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Activer la protection contre les attaques par force brute
                <span className="text-xs text-gray-500 block">
                  Bloque temporairement les IP après plusieurs tentatives échouées
                </span>
              </span>
            </label>
          </div>
        </div>

        {/* Liste blanche IP */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Liste Blanche IP</h3>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.enableIPWhitelist}
              onChange={(e) => handleInputChange("enableIPWhitelist", e.target.checked)}
              className="h-4 w-4 text-[#FF8200] focus:ring-[#FF8200] border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              Activer la liste blanche IP
              <span className="text-xs text-gray-500 block">
                Seules les IP listées pourront accéder à l'administration
              </span>
            </span>
          </label>

          {config.enableIPWhitelist && (
            <div className="space-y-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newIP}
                  onChange={(e) => setNewIP(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] text-gray-900 bg-white"
                  placeholder="192.168.1.1"
                />
                <button
                  onClick={addIP}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF8200] transition-all duration-200"
                >
                  Ajouter
                </button>
              </div>

              <div className="space-y-2">
                {config.allowedIPs.map((ip) => (
                  <div key={ip} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                    <span className="text-sm text-gray-700">{ip}</span>
                    <button
                      onClick={() => removeIP(ip)}
                      className="text-red-600 hover:text-red-800 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Journal de sécurité */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Journal de Sécurité</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Dernière connexion admin:</span>
              <span className="text-gray-900">{new Date().toLocaleString('fr-FR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tentatives échouées (24h):</span>
              <span className="text-gray-900">2</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">IP bloquées:</span>
              <span className="text-gray-900">0</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            onClick={() => setConfig({
              passwordMinLength: 8,
              passwordRequireUppercase: true,
              passwordRequireLowercase: true,
              passwordRequireNumbers: true,
              passwordRequireSpecialChars: false,
              sessionTimeout: 60,
              maxLoginAttempts: 5,
              enable2FA: true,
              enableBruteForceProtection: true,
              enableIPWhitelist: false,
              allowedIPs: ["127.0.0.1", "192.168.1.1"],
            })}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF8200] transition-all duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Réinitialiser
          </button>

          <button
            onClick={handleSave}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-[#FF8200] hover:bg-[#E67300] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF8200] transition-all duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}
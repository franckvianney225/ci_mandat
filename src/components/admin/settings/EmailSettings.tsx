"use client";

import { useState } from "react";

interface EmailConfig {
  smtpHost: string;
  smtpPort: string;
  smtpUsername: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  useSSL: boolean;
  useTLS: boolean;
}

export default function EmailSettings() {
  const [config, setConfig] = useState<EmailConfig>({
    smtpHost: "smtp.gmail.com",
    smtpPort: "587",
    smtpUsername: "",
    smtpPassword: "",
    fromEmail: "noreply@ci-mandat.ci",
    fromName: "CI-Mandat",
    useSSL: false,
    useTLS: true,
  });

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleInputChange = (field: keyof EmailConfig, value: string | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      // TODO: Implémenter l'appel API pour sauvegarder la configuration
      console.log("Sauvegarde de la configuration:", config);
      alert("Configuration SMTP sauvegardée avec succès !");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert("Erreur lors de la sauvegarde de la configuration");
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      // TODO: Implémenter le test de connexion SMTP
      await new Promise(resolve => setTimeout(resolve, 2000));
      setTestResult({
        success: true,
        message: "Connexion SMTP réussie ! Les paramètres sont corrects."
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: "Échec de la connexion SMTP. Vérifiez vos paramètres."
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-semibold text-gray-900">Configuration SMTP</h2>
        <p className="text-gray-600 mt-1">
          Configurez les paramètres d'envoi d'emails pour les notifications
        </p>
      </div>

      {/* Configuration SMTP */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Serveur SMTP */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Serveur SMTP
            </label>
            <input
              type="text"
              value={config.smtpHost}
              onChange={(e) => handleInputChange("smtpHost", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] text-gray-900 bg-white"
              placeholder="smtp.gmail.com"
            />
          </div>

          {/* Port SMTP */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Port SMTP
            </label>
            <input
              type="text"
              value={config.smtpPort}
              onChange={(e) => handleInputChange("smtpPort", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] text-gray-900 bg-white"
              placeholder="587"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Nom d'utilisateur */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom d'utilisateur SMTP
            </label>
            <input
              type="text"
              value={config.smtpUsername}
              onChange={(e) => handleInputChange("smtpUsername", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] text-gray-900 bg-white"
              placeholder="votre@email.com"
            />
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe SMTP
            </label>
            <input
              type="password"
              value={config.smtpPassword}
              onChange={(e) => handleInputChange("smtpPassword", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] text-gray-900 bg-white"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Email expéditeur */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email expéditeur
            </label>
            <input
              type="email"
              value={config.fromEmail}
              onChange={(e) => handleInputChange("fromEmail", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] text-gray-900 bg-white"
              placeholder="noreply@ci-mandat.ci"
            />
          </div>

          {/* Nom expéditeur */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom expéditeur
            </label>
            <input
              type="text"
              value={config.fromName}
              onChange={(e) => handleInputChange("fromName", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] text-gray-900 bg-white"
              placeholder="CI-Mandat"
            />
          </div>
        </div>

        {/* Options de sécurité */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Options de sécurité</h3>
          
          <div className="flex items-center space-x-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.useSSL}
                onChange={(e) => handleInputChange("useSSL", e.target.checked)}
                className="h-4 w-4 text-[#FF8200] focus:ring-[#FF8200] border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Utiliser SSL</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.useTLS}
                onChange={(e) => handleInputChange("useTLS", e.target.checked)}
                className="h-4 w-4 text-[#FF8200] focus:ring-[#FF8200] border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Utiliser TLS</span>
            </label>
          </div>
        </div>

        {/* Test de connexion */}
        {testResult && (
          <div className={`p-4 rounded-lg border ${
            testResult.success 
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}>
            <div className="flex items-center">
              {testResult.success ? (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              {testResult.message}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF8200] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isTesting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Test en cours...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Tester la connexion
              </>
            )}
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
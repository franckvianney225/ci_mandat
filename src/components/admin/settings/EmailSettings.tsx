
"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";

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
    smtpHost: "",
    smtpPort: "",
    smtpUsername: "",
    smtpPassword: "",
    fromEmail: "",
    fromName: "",
    useSSL: false,
    useTLS: true,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [sendTestResult, setSendTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Charger la configuration existante au montage du composant
  useEffect(() => {
    const loadEmailConfig = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getEmailConfig();
        
        if (response.success && response.data) {
          setConfig(response.data);
        } else {
          console.error('Erreur lors du chargement de la configuration:', response.error);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la configuration email:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEmailConfig();
  }, []);

  const handleInputChange = (field: keyof EmailConfig, value: string | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setTestResult(null);
    setSaveMessage(null);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveMessage(null);
      
      const response = await apiClient.updateEmailConfig(config);
      
      if (response.success) {
        setSaveMessage({
          type: 'success',
          message: response.message || 'Configuration SMTP sauvegardée avec succès !'
        });
      } else {
        setSaveMessage({
          type: 'error',
          message: response.error || 'Erreur lors de la sauvegarde de la configuration'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setSaveMessage({
        type: 'error',
        message: 'Erreur de connexion au serveur'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setSaveMessage(null);
    
    try {
      const response = await apiClient.testEmailConnection(config);
      
      if (response.success) {
        setTestResult({
          success: true,
          message: response.message || 'Connexion SMTP réussie ! Les paramètres sont corrects.'
        });
      } else {
        setTestResult({
          success: false,
          message: response.error || 'Échec de la connexion SMTP. Vérifiez vos paramètres.'
        });
      }
    } catch (error) {
      console.error('Erreur lors du test de connexion:', error);
      setTestResult({
        success: false,
        message: 'Erreur lors du test de connexion SMTP'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail.trim()) {
      setSendTestResult({
        success: false,
        message: 'Veuillez entrer une adresse email pour le test'
      });
      return;
    }

    setIsSendingTest(true);
    setSendTestResult(null);
    setSaveMessage(null);
    
    try {
      const response = await apiClient.sendTestEmail(config, testEmail);
      
      if (response.success) {
        setSendTestResult({
          success: true,
          message: response.message || `Email de test envoyé avec succès à ${testEmail} !`
        });
      } else {
        setSendTestResult({
          success: false,
          message: response.error || 'Échec de l\'envoi de l\'email de test. Vérifiez vos paramètres.'
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du test email:', error);
      setSendTestResult({
        success: false,
        message: 'Erreur lors de l\'envoi de l\'email de test'
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-xl font-semibold text-gray-900">Configuration SMTP</h2>
          <p className="text-gray-600 mt-1">Configurez les paramètres d'envoi d'emails pour les notifications</p>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-semibold text-gray-900">Configuration SMTP</h2>
        <p className="text-gray-600 mt-1">Configurez les paramètres d'envoi d'emails pour les notifications</p>
      </div>

      {/* Message de sauvegarde */}
      {saveMessage && (
        <div className={`p-4 rounded-lg border ${saveMessage.type === 'success' ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
          <div className="flex items-center">
            {saveMessage.type === 'success' ? (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            {saveMessage.message}
          </div>
        </div>
      )}

      {/* Configuration SMTP */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Serveur SMTP */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Serveur SMTP</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Port SMTP</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Nom d'utilisateur SMTP</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe SMTP</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Email expéditeur</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Nom expéditeur</label>
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
          <div className={`p-4 rounded-lg border ${testResult.success ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
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

        {/* Test d'envoi d'email */}
        <div className="space-y-4 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Test d'envoi d'email</h3>
          <p className="text-sm text-gray-600">
            Testez l'envoi d'un email réel avec la configuration actuelle
          </p>
          
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email de test</label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] text-gray-900 bg-white"
                placeholder="test@example.com"
              />
            </div>
            
            <button
              onClick={handleSendTestEmail}
              disabled={isSendingTest || isSaving || isTesting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isSendingTest ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Envoi...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Envoyer un test
                </>
              )}
            </button>
          </div>

          {sendTestResult && (
            <div className={`p-4 rounded-lg border ${sendTestResult.success ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
              <div className="flex items-center">
                {sendTestResult.success ? (
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                {sendTestResult.message}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            onClick={handleTestConnection}
            disabled={isTesting || isSaving}
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
            disabled={isSaving || isTesting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-[#FF8200] hover:bg-[#E67300] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF8200] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sauvegarde...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Sauvegarder
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
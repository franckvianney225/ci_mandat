"use client";

import { useState, useEffect } from "react";
import GeneralSettings from "./GeneralSettings";
import SystemOptions from "./SystemOptions";

interface SystemSecurityConfig {
  // Configuration système (correspond au backend)
  appName: string;
  appUrl: string;
  maintenanceMode: boolean;
  debugMode: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  enableAuditLogs: boolean;
  enableEmailNotifications: boolean;
  backupFrequency: string;
  dataRetentionDays: number;
  
  // Configuration sécurité (frontend seulement - non sauvegardée)
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  enable2FA: boolean;
  enableBruteForceProtection: boolean;
  enableIPWhitelist: boolean;
  allowedIPs: string[];
}

export default function SystemSecuritySettings() {
  const [config, setConfig] = useState<SystemSecurityConfig>({
    // Configuration système
    appName: "CI-Mandat",
    appUrl: "https://ci-mandat.ci",
    maintenanceMode: false,
    debugMode: false,
    enableAuditLogs: true,
    enableEmailNotifications: true,
    backupFrequency: "daily",
    dataRetentionDays: 365,
    
    // Configuration sécurité
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: false,
    enable2FA: true,
    enableBruteForceProtection: true,
    enableIPWhitelist: false,
    allowedIPs: ["127.0.0.1", "192.168.1.1"],
  });

  const [loading, setLoading] = useState(false);

  // Charger la configuration au montage du composant
  useEffect(() => {
    loadSystemConfig();
  }, []);

  const loadSystemConfig = async () => {
    try {
      setLoading(true);
      // Utiliser fetch directement avec l'URL complète
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${API_BASE_URL}/settings/system`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Fusionner les données du backend avec les valeurs par défaut du frontend
          setConfig({
            ...config, // Garder les valeurs frontend par défaut
            ...result.data // Remplacer par les données du backend
          });
        }
      } else {
        console.error("Erreur HTTP:", response.status);
      }
    } catch (error) {
      console.error("Erreur lors du chargement de la configuration:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SystemSecurityConfig, value: string | boolean | number | string[]) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      
      // Préparer les données pour le backend (uniquement les champs supportés)
      const backendConfig = {
        appName: config.appName,
        appUrl: config.appUrl,
        maintenanceMode: config.maintenanceMode,
        debugMode: config.debugMode,
        sessionTimeout: config.sessionTimeout,
        maxLoginAttempts: config.maxLoginAttempts,
        enableAuditLogs: config.enableAuditLogs,
        enableEmailNotifications: config.enableEmailNotifications,
        backupFrequency: config.backupFrequency,
        dataRetentionDays: config.dataRetentionDays,
      };

      const response = await fetch(`${API_BASE_URL}/settings/system`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(backendConfig),
      });

      const result = await response.json();

      if (result.success) {
        alert("Configuration système sauvegardée avec succès !");
      } else {
        alert(`Erreur lors de la sauvegarde: ${result.error}`);
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert("Erreur lors de la sauvegarde de la configuration. Vérifiez que le backend est démarré.");
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF8200] mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de la configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-semibold text-gray-900">Paramètres Système et Sécurité</h2>
        <p className="text-gray-600 mt-1">
          Configurez les paramètres généraux et de sécurité de l&apos;application
        </p>
      </div>

      {/* Configuration générale */}
      <GeneralSettings 
        config={config}
        onInputChange={handleInputChange}
      />

      {/* Options système */}
      <SystemOptions 
        config={config}
        onInputChange={handleInputChange}
      />

      {/* Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          onClick={() => setConfig({
            appName: "CI-Mandat",
            appUrl: "https://ci-mandat.ci",
            maintenanceMode: false,
            debugMode: false,
            enableAuditLogs: true,
            enableEmailNotifications: true,
            backupFrequency: "daily",
            dataRetentionDays: 365,
            sessionTimeout: 60,
            maxLoginAttempts: 5,
            passwordMinLength: 8,
            passwordRequireUppercase: true,
            passwordRequireLowercase: true,
            passwordRequireNumbers: true,
            passwordRequireSpecialChars: false,
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
  );
}
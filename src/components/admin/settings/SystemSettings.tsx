"use client";

import { useState } from "react";

interface SystemConfig {
  appName: string;
  appUrl: string;
  timezone: string;
  dateFormat: string;
  language: string;
  maxFileSize: number;
  allowedFileTypes: string[];
  maintenanceMode: boolean;
  debugMode: boolean;
}

export default function SystemSettings() {
  const [config, setConfig] = useState<SystemConfig>({
    appName: "CI-Mandat",
    appUrl: "https://ci-mandat.ci",
    timezone: "Africa/Abidjan",
    dateFormat: "DD/MM/YYYY",
    language: "fr",
    maxFileSize: 10,
    allowedFileTypes: [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"],
    maintenanceMode: false,
    debugMode: false,
  });

  const handleInputChange = (field: keyof SystemConfig, value: string | boolean | number | string[]) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      // TODO: Implémenter l'appel API pour sauvegarder la configuration
      console.log("Sauvegarde de la configuration système:", config);
      alert("Configuration système sauvegardée avec succès !");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert("Erreur lors de la sauvegarde de la configuration");
    }
  };

  const timezones = [
    "Africa/Abidjan",
    "Africa/Accra",
    "Africa/Addis_Ababa",
    "Africa/Algiers",
    "Africa/Cairo",
    "Europe/Paris",
    "UTC"
  ];

  const languages = [
    { value: "fr", label: "Français" },
    { value: "en", label: "English" },
    { value: "es", label: "Español" }
  ];

  const dateFormats = [
    { value: "DD/MM/YYYY", label: "DD/MM/YYYY (31/12/2024)" },
    { value: "MM/DD/YYYY", label: "MM/DD/YYYY (12/31/2024)" },
    { value: "YYYY-MM-DD", label: "YYYY-MM-DD (2024-12-31)" }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-semibold text-gray-900">Paramètres Système</h2>
        <p className="text-gray-600 mt-1">
          Configurez les paramètres généraux de l'application
        </p>
      </div>

      {/* Configuration générale */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Nom de l'application */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de l'application
            </label>
            <input
              type="text"
              value={config.appName}
              onChange={(e) => handleInputChange("appName", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] text-gray-900 bg-white"
              placeholder="CI-Mandat"
            />
          </div>

          {/* URL de l'application */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL de l'application
            </label>
            <input
              type="url"
              value={config.appUrl}
              onChange={(e) => handleInputChange("appUrl", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] text-gray-900 bg-white"
              placeholder="https://ci-mandat.ci"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {/* Fuseau horaire */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fuseau horaire
            </label>
            <select
              value={config.timezone}
              onChange={(e) => handleInputChange("timezone", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] text-gray-900 bg-white appearance-none"
            >
              {timezones.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>

          {/* Format de date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Format de date
            </label>
            <select
              value={config.dateFormat}
              onChange={(e) => handleInputChange("dateFormat", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] text-gray-900 bg-white appearance-none"
            >
              {dateFormats.map(format => (
                <option key={format.value} value={format.value}>{format.label}</option>
              ))}
            </select>
          </div>

          {/* Langue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Langue
            </label>
            <select
              value={config.language}
              onChange={(e) => handleInputChange("language", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] text-gray-900 bg-white appearance-none"
            >
              {languages.map(lang => (
                <option key={lang.value} value={lang.value}>{lang.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Configuration des fichiers */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Configuration des fichiers</h3>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Taille maximale des fichiers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taille maximale des fichiers (MB)
              </label>
              <input
                type="number"
                value={config.maxFileSize}
                onChange={(e) => handleInputChange("maxFileSize", parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] text-gray-900 bg-white"
                min="1"
                max="100"
              />
            </div>

            {/* Types de fichiers autorisés */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Types de fichiers autorisés
              </label>
              <input
                type="text"
                value={config.allowedFileTypes.join(", ")}
                onChange={(e) => handleInputChange("allowedFileTypes", e.target.value.split(", "))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] text-gray-900 bg-white"
                placeholder=".pdf, .jpg, .png"
              />
              <p className="text-xs text-gray-500 mt-1">
                Séparez les extensions par des virgules
              </p>
            </div>
          </div>
        </div>

        {/* Options système */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Options système</h3>
          
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.maintenanceMode}
                onChange={(e) => handleInputChange("maintenanceMode", e.target.checked)}
                className="h-4 w-4 text-[#FF8200] focus:ring-[#FF8200] border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Mode maintenance
                <span className="text-xs text-gray-500 block">
                  L'application sera inaccessible aux utilisateurs
                </span>
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.debugMode}
                onChange={(e) => handleInputChange("debugMode", e.target.checked)}
                className="h-4 w-4 text-[#FF8200] focus:ring-[#FF8200] border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Mode débogage
                <span className="text-xs text-gray-500 block">
                  Affiche les erreurs détaillées (désactiver en production)
                </span>
              </span>
            </label>
          </div>
        </div>

        {/* Informations système */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Informations système</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Version:</span>
              <span className="ml-2 text-gray-900">1.0.0</span>
            </div>
            <div>
              <span className="text-gray-600">Environnement:</span>
              <span className="ml-2 text-gray-900">Développement</span>
            </div>
            <div>
              <span className="text-gray-600">Base de données:</span>
              <span className="ml-2 text-gray-900">PostgreSQL 15</span>
            </div>
            <div>
              <span className="text-gray-600">Dernier démarrage:</span>
              <span className="ml-2 text-gray-900">{new Date().toLocaleString('fr-FR')}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            onClick={() => setConfig({
              appName: "CI-Mandat",
              appUrl: "https://ci-mandat.ci",
              timezone: "Africa/Abidjan",
              dateFormat: "DD/MM/YYYY",
              language: "fr",
              maxFileSize: 10,
              allowedFileTypes: [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"],
              maintenanceMode: false,
              debugMode: false,
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
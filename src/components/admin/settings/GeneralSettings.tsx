"use client";

interface SystemSecurityConfig {
  appName: string;
  appUrl: string;
  sessionTimeout: number;
  maxLoginAttempts: number;
  backupFrequency: string;
  dataRetentionDays: number;
}

interface GeneralSettingsProps {
  config: SystemSecurityConfig;
  onInputChange: (field: keyof SystemSecurityConfig, value: string | boolean | number | string[]) => void;
}

export default function GeneralSettings({ config, onInputChange }: GeneralSettingsProps) {
  const backupFrequencies = [
    { value: "hourly", label: "Toutes les heures" },
    { value: "daily", label: "Quotidienne" },
    { value: "weekly", label: "Hebdomadaire" },
    { value: "monthly", label: "Mensuelle" }
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Configuration Générale</h3>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Nom de l'application */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom de l'application
          </label>
          <input
            type="text"
            value={config.appName}
            onChange={(e) => onInputChange("appName", e.target.value)}
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
            onChange={(e) => onInputChange("appUrl", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] text-gray-900 bg-white"
            placeholder="https://ci-mandat.ci"
          />
        </div>
      </div>

      {/* Sécurité et Sessions */}
      <div className="space-y-6">
        <h4 className="text-md font-medium text-gray-900">Sécurité et Sessions</h4>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Timeout de session */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Délai d'expiration de session (minutes)
            </label>
            <input
              type="number"
              value={config.sessionTimeout}
              onChange={(e) => onInputChange("sessionTimeout", parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] text-gray-900 bg-white"
              min="15"
              max="480"
            />
            <p className="text-xs text-gray-500 mt-1">
              Durée d'inactivité avant déconnexion automatique
            </p>
          </div>

          {/* Tentatives de connexion */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tentatives de connexion maximum
            </label>
            <input
              type="number"
              value={config.maxLoginAttempts}
              onChange={(e) => onInputChange("maxLoginAttempts", parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] text-gray-900 bg-white"
              min="3"
              max="10"
            />
            <p className="text-xs text-gray-500 mt-1">
              Nombre d'échecs avant blocage du compte
            </p>
          </div>
        </div>
      </div>

      {/* Sauvegarde et Conservation */}
      <div className="space-y-6">
        <h4 className="text-md font-medium text-gray-900">Sauvegarde et Conservation</h4>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Fréquence de sauvegarde */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fréquence de sauvegarde
            </label>
            <select
              value={config.backupFrequency}
              onChange={(e) => onInputChange("backupFrequency", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] text-gray-900 bg-white appearance-none"
            >
              {backupFrequencies.map(freq => (
                <option key={freq.value} value={freq.value}>{freq.label}</option>
              ))}
            </select>
          </div>

          {/* Conservation des données */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conservation des données (jours)
            </label>
            <input
              type="number"
              value={config.dataRetentionDays}
              onChange={(e) => onInputChange("dataRetentionDays", parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] text-gray-900 bg-white"
              min="30"
              max="1095"
            />
            <p className="text-xs text-gray-500 mt-1">
              Durée de conservation des données avant suppression
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

interface SystemSecurityConfig {
  maintenanceMode: boolean;
  debugMode: boolean;
  enableAuditLogs: boolean;
  enableEmailNotifications: boolean;
}

interface SystemOptionsProps {
  config: SystemSecurityConfig;
  onInputChange: (field: keyof SystemSecurityConfig, value: string | boolean | number | string[]) => void;
}

export default function SystemOptions({ config, onInputChange }: SystemOptionsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Options Système</h3>
      
      <div className="space-y-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={config.maintenanceMode}
            onChange={(e) => onInputChange("maintenanceMode", e.target.checked)}
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
            onChange={(e) => onInputChange("debugMode", e.target.checked)}
            className="h-4 w-4 text-[#FF8200] focus:ring-[#FF8200] border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">
            Mode débogage
            <span className="text-xs text-gray-500 block">
              Affiche les erreurs détaillées (désactiver en production)
            </span>
          </span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={config.enableAuditLogs}
            onChange={(e) => onInputChange("enableAuditLogs", e.target.checked)}
            className="h-4 w-4 text-[#FF8200] focus:ring-[#FF8200] border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">
            Logs d'audit
            <span className="text-xs text-gray-500 block">
              Enregistre toutes les actions des administrateurs
            </span>
          </span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={config.enableEmailNotifications}
            onChange={(e) => onInputChange("enableEmailNotifications", e.target.checked)}
            className="h-4 w-4 text-[#FF8200] focus:ring-[#FF8200] border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">
            Notifications par email
            <span className="text-xs text-gray-500 block">
              Envoie des alertes pour les activités importantes
            </span>
          </span>
        </label>
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
    </div>
  );
}
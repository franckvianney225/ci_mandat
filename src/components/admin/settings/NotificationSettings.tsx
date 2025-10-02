"use client";

import { useState } from "react";

interface NotificationConfig {
  emailNotifications: {
    newRequest: boolean;
    requestValidated: boolean;
    requestRejected: boolean;
    systemAlerts: boolean;
  };
  inAppNotifications: {
    newRequest: boolean;
    requestValidated: boolean;
    requestRejected: boolean;
    systemMaintenance: boolean;
  };
  smsNotifications: {
    criticalAlerts: boolean;
    systemDown: boolean;
  };
  webhookUrl: string;
  slackWebhookUrl: string;
}

export default function NotificationSettings() {
  const [config, setConfig] = useState<NotificationConfig>({
    emailNotifications: {
      newRequest: true,
      requestValidated: true,
      requestRejected: true,
      systemAlerts: true,
    },
    inAppNotifications: {
      newRequest: true,
      requestValidated: true,
      requestRejected: true,
      systemMaintenance: true,
    },
    smsNotifications: {
      criticalAlerts: false,
      systemDown: true,
    },
    webhookUrl: "",
    slackWebhookUrl: "",
  });

  const handleEmailNotificationChange = (key: keyof NotificationConfig["emailNotifications"], value: boolean) => {
    setConfig(prev => ({
      ...prev,
      emailNotifications: {
        ...prev.emailNotifications,
        [key]: value
      }
    }));
  };

  const handleInAppNotificationChange = (key: keyof NotificationConfig["inAppNotifications"], value: boolean) => {
    setConfig(prev => ({
      ...prev,
      inAppNotifications: {
        ...prev.inAppNotifications,
        [key]: value
      }
    }));
  };

  const handleSmsNotificationChange = (key: keyof NotificationConfig["smsNotifications"], value: boolean) => {
    setConfig(prev => ({
      ...prev,
      smsNotifications: {
        ...prev.smsNotifications,
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      // TODO: Implémenter l'appel API pour sauvegarder la configuration
      console.log("Sauvegarde de la configuration notifications:", config);
      alert("Configuration des notifications sauvegardée avec succès !");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert("Erreur lors de la sauvegarde de la configuration");
    }
  };

  const testNotification = async (type: string) => {
    try {
      // TODO: Implémenter le test de notification
      console.log(`Test de notification ${type}`);
      alert(`Notification ${type} de test envoyée !`);
    } catch (error) {
      console.error("Erreur lors du test:", error);
      alert("Erreur lors de l'envoi de la notification de test");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-semibold text-gray-900">Paramètres des Notifications</h2>
        <p className="text-gray-600 mt-1">
          Configurez les préférences de notification pour l'application
        </p>
      </div>

      {/* Configuration des notifications */}
      <div className="space-y-6">
        {/* Notifications par email */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Notifications par Email</h3>
            <button
              onClick={() => testNotification("email")}
              className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF8200] transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Tester
            </button>
          </div>
          
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Nouvelle demande soumise
                </span>
                <span className="text-xs text-gray-500 block">
                  Recevoir un email lorsqu'une nouvelle demande est soumise
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.emailNotifications.newRequest}
                onChange={(e) => handleEmailNotificationChange("newRequest", e.target.checked)}
                className="h-4 w-4 text-[#FF8200] focus:ring-[#FF8200] border-gray-300 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Demande validée
                </span>
                <span className="text-xs text-gray-500 block">
                  Recevoir un email lorsqu'une demande est validée
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.emailNotifications.requestValidated}
                onChange={(e) => handleEmailNotificationChange("requestValidated", e.target.checked)}
                className="h-4 w-4 text-[#FF8200] focus:ring-[#FF8200] border-gray-300 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Demande rejetée
                </span>
                <span className="text-xs text-gray-500 block">
                  Recevoir un email lorsqu'une demande est rejetée
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.emailNotifications.requestRejected}
                onChange={(e) => handleEmailNotificationChange("requestRejected", e.target.checked)}
                className="h-4 w-4 text-[#FF8200] focus:ring-[#FF8200] border-gray-300 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Alertes système
                </span>
                <span className="text-xs text-gray-500 block">
                  Recevoir des emails pour les alertes système importantes
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.emailNotifications.systemAlerts}
                onChange={(e) => handleEmailNotificationChange("systemAlerts", e.target.checked)}
                className="h-4 w-4 text-[#FF8200] focus:ring-[#FF8200] border-gray-300 rounded"
              />
            </label>
          </div>
        </div>

        {/* Notifications in-app */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Notifications In-App</h3>
            <button
              onClick={() => testNotification("in-app")}
              className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF8200] transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Tester
            </button>
          </div>
          
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Nouvelle demande
                </span>
                <span className="text-xs text-gray-500 block">
                  Afficher une notification dans l'application
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.inAppNotifications.newRequest}
                onChange={(e) => handleInAppNotificationChange("newRequest", e.target.checked)}
                className="h-4 w-4 text-[#FF8200] focus:ring-[#FF8200] border-gray-300 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Maintenance système
                </span>
                <span className="text-xs text-gray-500 block">
                  Notifier des périodes de maintenance
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.inAppNotifications.systemMaintenance}
                onChange={(e) => handleInAppNotificationChange("systemMaintenance", e.target.checked)}
                className="h-4 w-4 text-[#FF8200] focus:ring-[#FF8200] border-gray-300 rounded"
              />
            </label>
          </div>
        </div>

        {/* Notifications SMS */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Notifications SMS</h3>
          
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Alertes critiques
                </span>
                <span className="text-xs text-gray-500 block">
                  Envoyer des SMS pour les alertes critiques (coût supplémentaire)
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.smsNotifications.criticalAlerts}
                onChange={(e) => handleSmsNotificationChange("criticalAlerts", e.target.checked)}
                className="h-4 w-4 text-[#FF8200] focus:ring-[#FF8200] border-gray-300 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Système hors ligne
                </span>
                <span className="text-xs text-gray-500 block">
                  Notifier par SMS en cas d'indisponibilité du système
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.smsNotifications.systemDown}
                onChange={(e) => handleSmsNotificationChange("systemDown", e.target.checked)}
                className="h-4 w-4 text-[#FF8200] focus:ring-[#FF8200] border-gray-300 rounded"
              />
            </label>
          </div>
        </div>

        {/* Intégrations webhook */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Intégrations Webhook</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL Webhook personnalisée
              </label>
              <input
                type="url"
                value={config.webhookUrl}
                onChange={(e) => setConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] text-gray-900 bg-white"
                placeholder="https://votre-domaine.com/webhook"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL pour recevoir les notifications via webhook
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Webhook Slack
              </label>
              <input
                type="url"
                value={config.slackWebhookUrl}
                onChange={(e) => setConfig(prev => ({ ...prev, slackWebhookUrl: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8200] focus:border-[#FF8200] text-gray-900 bg-white"
                placeholder="https://hooks.slack.com/services/..."
              />
              <p className="text-xs text-gray-500 mt-1">
                URL du webhook Slack pour les notifications d'équipe
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            onClick={() => setConfig({
              emailNotifications: {
                newRequest: true,
                requestValidated: true,
                requestRejected: true,
                systemAlerts: true,
              },
              inAppNotifications: {
                newRequest: true,
                requestValidated: true,
                requestRejected: true,
                systemMaintenance: true,
              },
              smsNotifications: {
                criticalAlerts: false,
                systemDown: true,
              },
              webhookUrl: "",
              slackWebhookUrl: "",
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
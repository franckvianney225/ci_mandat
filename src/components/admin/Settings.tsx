"use client";

import { useState } from "react";
import EmailSettings from "./settings/EmailSettings";
import SystemSettings from "./settings/SystemSettings";
import SecuritySettings from "./settings/SecuritySettings";
import NotificationSettings from "./settings/NotificationSettings";

type SettingsTab = "email" | "system" | "security" | "notifications";

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("email");

  const tabs = [
    { id: "email" as SettingsTab, name: "Configuration Email", icon: "📧" },
    { id: "system" as SettingsTab, name: "Paramètres Système", icon: "⚙️" },
    { id: "security" as SettingsTab, name: "Sécurité", icon: "🔒" },
    { id: "notifications" as SettingsTab, name: "Notifications", icon: "🔔" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "email":
        return <EmailSettings />;
      case "system":
        return <SystemSettings />;
      case "security":
        return <SecuritySettings />;
      case "notifications":
        return <NotificationSettings />;
      default:
        return <EmailSettings />;
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
            <p className="text-gray-600 mt-1">Configurez les paramètres de l'application</p>
          </div>
          <div className="text-sm text-gray-500">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Navigation latérale */}
        <div className="lg:w-64">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <nav className="space-y-1 p-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-[#FF8200] text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <span className="mr-3 text-lg">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

interface User {
  id: string;
  email: string;
  role: "admin" | "super_admin";
  personalData: {
    firstName: string;
    lastName: string;
  };
}

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await apiClient.verifyToken();
        if (response.success && response.data) {
          // L'endpoint /auth/profile retourne { user: User }
          setCurrentUser(response.data.user as unknown as User);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de l'utilisateur:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const handleLogout = async () => {
    try {
      // Appeler l'endpoint de déconnexion pour supprimer le cookie côté serveur
      await apiClient.logout();
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    } finally {
      // Rediriger vers la page de connexion
      router.push("/ci-mandat-admin");
    }
  };

  const menuItems = [
    {
      id: "dashboard",
      name: "Tableau de bord",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      visible: true, // Toujours visible
    },
    {
      id: "requests",
      name: "Demandes",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      visible: true, // Toujours visible
    },
    {
      id: "users",
      name: "Utilisateurs",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      visible: currentUser?.role === "super_admin", // Seulement pour super_admin
    },
    {
      id: "settings",
      name: "Paramètres",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      visible: currentUser?.role === "super_admin", // Seulement pour super_admin
    },
    {
      id: "profile",
      name: "Mon Profil",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      visible: true, // Toujours visible pour tous les utilisateurs
    },
  ];

  // Filtrer les éléments de menu selon la visibilité
  const visibleMenuItems = menuItems.filter(item => item.visible);

  return (
    <div className="w-64 bg-gradient-to-b from-white to-gray-50 shadow-xl border-r border-gray-100 flex flex-col transition-all duration-300 hover:shadow-2xl">
      {/* Logo et titre amélioré */}
      <div className="flex items-center justify-center px-6 py-5 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="h-10 w-10 rounded-xl shadow-md flex items-center justify-center overflow-hidden">
          <img
            src="/logorhdp.jpeg"
            alt="Logo RHD"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="ml-3">
          <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            CI-MANDAT
          </h1>
          <p className="text-xs text-gray-500 font-medium">Panel d&apos;administration</p>
        </div>
      </div>

      {/* Navigation améliorée */}
      <nav className="flex-1 px-3 py-6">
        <ul className="space-y-1">
          {visibleMenuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 transform hover:scale-102 ${
                  activeSection === item.id
                    ? "bg-[#FF8200] text-white shadow-lg border border-[#FF8200]/30"
                    : "text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-md border border-transparent"
                }`}
              >
                <span className={`mr-3 transition-colors duration-300 ${
                  activeSection === item.id ? "text-white" : "text-gray-400 group-hover:text-[#FF8200]"
                }`}>
                  {item.icon}
                </span>
                {item.name}
                {activeSection === item.id && (
                  <span className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Informations utilisateur connecté */}
      {!isLoading && currentUser && (
        <div className="p-4 border-t border-gray-100 bg-white/60 backdrop-blur-sm">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="w-8 h-8 bg-gradient-to-r from-[#FF8200] to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {currentUser.personalData?.firstName?.charAt(0) || currentUser.email.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="text-sm font-semibold text-gray-800 truncate">
              {currentUser.personalData?.firstName && currentUser.personalData?.lastName
                ? `${currentUser.personalData.firstName} ${currentUser.personalData.lastName}`
                : currentUser.email
              }
            </div>
            <div className="text-xs text-gray-500 font-medium capitalize">
              {currentUser.role === "super_admin" ? "Super Administrateur" : "Administrateur"}
            </div>
          </div>
        </div>
      )}

      {/* Déconnexion améliorée */}
      <div className="p-4 border-t border-gray-100 bg-white/50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-white hover:bg-[#FF8200] rounded-xl transition-all duration-300 transform hover:scale-102 shadow-sm hover:shadow-md border border-gray-200 hover:border-[#FF8200]/50"
        >
          <svg className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Déconnexion
        </button>
      </div>
    </div>
  );
}
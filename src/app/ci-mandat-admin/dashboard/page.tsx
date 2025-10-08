"use client";

import { useState, useEffect, Suspense, lazy } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import { apiClient } from "@/lib/api";

// Composants chargés en lazy loading
const LazyDashboard = lazy(() => import("@/components/admin/Dashboard"));
const LazyRequestsManagement = lazy(() => import("@/components/admin/RequestsManagement"));
const LazyUsersManagement = lazy(() => import("@/components/admin/UsersManagement"));
const LazySettings = lazy(() => import("@/components/admin/Settings"));
const LazyProfile = lazy(() => import("@/components/admin/Profile"));

// Composants de fallback
import DashboardFallback from "@/components/fallback/DashboardFallback";
import RequestsManagementFallback from "@/components/fallback/RequestsManagementFallback";
import UsersManagementFallback from "@/components/fallback/UsersManagementFallback";
import SettingsFallback from "@/components/fallback/SettingsFallback";
import ProfileFallback from "@/components/fallback/ProfileFallback";

interface User {
  id: string;
  email: string;
  role: "admin" | "super_admin";
  personalData: {
    firstName: string;
    lastName: string;
    phone?: string;
  };
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Fonction pour mettre à jour l'utilisateur
  const handleUserUpdate = (updatedUser: User) => {
    console.log("🔄 Dashboard - handleUserUpdate appelé avec:", updatedUser);
    setCurrentUser(updatedUser);
  };
  const [activeSection, setActiveSection] = useState("dashboard");
  const router = useRouter();

  useEffect(() => {
    // Vérifier si l'utilisateur est authentifié et récupérer ses informations
    const checkAuth = async () => {
      try {
        const response = await apiClient.verifyToken();
        if (response.success && response.data) {
          // L'endpoint /auth/profile retourne { user: User }
          console.log("🔄 Dashboard - Données utilisateur chargées:", response.data.user);
          setCurrentUser(response.data.user as unknown as User);
          setIsAuthenticated(true);
        } else {
          router.push("/ci-mandat-admin");
        }
      } catch (error) {
        console.error("Erreur de vérification du token:", error);
        router.push("/ci-mandat-admin");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Rediriger si l'utilisateur admin essaie d'accéder à des sections réservées au super_admin
  useEffect(() => {
    if (currentUser && currentUser.role === "admin") {
      if (activeSection === "users" || activeSection === "settings") {
        setActiveSection("dashboard");
      }
    }
  }, [currentUser, activeSection]);

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <Suspense fallback={<DashboardFallback />}>
            <LazyDashboard onSectionChange={setActiveSection} />
          </Suspense>
        );
      case "requests":
        return (
          <Suspense fallback={<RequestsManagementFallback />}>
            <LazyRequestsManagement currentUser={currentUser} />
          </Suspense>
        );
      case "users":
        return (
          <Suspense fallback={<UsersManagementFallback />}>
            <LazyUsersManagement />
          </Suspense>
        );
      case "settings":
        return (
          <Suspense fallback={<SettingsFallback />}>
            <LazySettings />
          </Suspense>
        );
      case "profile":
        return (
          <Suspense fallback={<ProfileFallback />}>
            <LazyProfile
              currentUser={currentUser}
              onUserUpdate={handleUserUpdate}
            />
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={<DashboardFallback />}>
            <LazyDashboard onSectionChange={setActiveSection} />
          </Suspense>
        );
    }
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case "dashboard":
        return "Tableau de Bord";
      case "requests":
        return "Gestion des Demandes";
      case "users":
        return "Gestion des Utilisateurs";
      case "settings":
        return "Paramètres";
      case "profile":
        return "Mon Profil";
      default:
        return "Tableau de Bord";
    }
  };

  const getSectionSubtitle = () => {
    switch (activeSection) {
      case "dashboard":
        return "Vue d'ensemble des demandes";
      case "requests":
        return "Gérer toutes les demandes soumises";
      case "users":
        return "Gérer les comptes utilisateurs";
      case "settings":
        return "Configurer l'application";
      case "profile":
        return "Gérez vos informations personnelles";
      default:
        return "Vue d'ensemble des demandes";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Main Content Area */}
        <main className="flex-1 p-6">
          {/* Section Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{getSectionTitle()}</h1>
            <p className="text-gray-600 mt-1">{getSectionSubtitle()}</p>
          </div>
          
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
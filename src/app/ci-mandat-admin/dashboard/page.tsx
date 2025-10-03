"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import Dashboard from "@/components/admin/Dashboard";
import RequestsManagement from "@/components/admin/RequestsManagement";
import UsersManagement from "@/components/admin/UsersManagement";
import Settings from "@/components/admin/Settings";
import { apiClient } from "@/lib/api";

interface User {
  id: string;
  email: string;
  role: "admin" | "super_admin";
  personalData: {
    firstName: string;
    lastName: string;
  };
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState("dashboard");
  const router = useRouter();

  useEffect(() => {
    // Vérifier si l'utilisateur est authentifié et récupérer ses informations
    const checkAuth = async () => {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        router.push("/ci-mandat-admin");
        return;
      }

      try {
        const response = await apiClient.verifyToken();
        if (response.success && response.data) {
          // L'endpoint /auth/profile retourne directement l'utilisateur
          setCurrentUser(response.data as unknown as User);
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
        return <Dashboard onSectionChange={setActiveSection} />;
      case "requests":
        return <RequestsManagement currentUser={currentUser} />;
      case "users":
        return <UsersManagement />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard onSectionChange={setActiveSection} />;
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
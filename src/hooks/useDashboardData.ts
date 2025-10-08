"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { useApiCache } from "./useApiCache";

interface DashboardStats {
  totalRequests: number;
  validatedRequests: number;
  pendingRequests: number;
  rejectedRequests: number;
  totalUsers: number;
  activeUsers: number;
}

interface RecentRequest {
  id: string;
  clientName: string;
  email: string;
  status: "pending" | "validated" | "rejected";
  statusText: string;
  createdAt: string;
  department: string;
}

interface MandateData {
  id: string;
  formData: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    circonscription: string;
  };
  status: string;
  createdAt: string;
  referenceNumber: string;
}

interface MandateStatistics {
  total: number;
  pending: number;
  adminApproved: number;
  superAdminApproved: number;
  rejected: number;
}

// Fonction pour convertir les statuts backend en statuts frontend
const mapBackendStatusToFrontend = (backendStatus: string): "pending" | "validated" | "rejected" => {
  switch (backendStatus) {
    case "pending_validation":
      return "pending";
    case "admin_approved":
    case "super_admin_approved":
      return "validated";
    case "rejected":
      return "rejected";
    default:
      return "pending";
  }
};

export function useDashboardData() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRequests: 0,
    validatedRequests: 0,
    pendingRequests: 0,
    rejectedRequests: 0,
    totalUsers: 0,
    activeUsers: 0
  });
  
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  
  const { callApi, loading, error } = useApiCache({
    cacheDuration: 60000, // Cache de 1 minute
    minInterval: 30000, // Intervalle minimum de 30 secondes
  });

  const loadDashboardData = async (forceRefresh = false) => {
    try {
      // Charger les statistiques
      const statsData = await callApi<MandateStatistics>(
        'dashboard-stats',
        async () => {
          const response = await apiClient.getMandateStatistics();
          if (!response.success || !response.data) {
            throw new Error(response.error || 'Erreur lors du chargement des statistiques');
          }
          return response.data as MandateStatistics;
        },
        forceRefresh
      );

      if (statsData) {
        const totalValidated = statsData.adminApproved + statsData.superAdminApproved;
        setStats({
          totalRequests: statsData.total,
          validatedRequests: totalValidated,
          pendingRequests: statsData.pending,
          rejectedRequests: statsData.rejected,
          totalUsers: 0,
          activeUsers: 0
        });
      }

      // Charger les mandats récents
      const recentData = await callApi<MandateData[]>(
        'dashboard-recent',
        async () => {
          const response = await apiClient.getRecentMandates();
          if (!response.success || !response.data) {
            throw new Error(response.error || 'Erreur lors du chargement des mandats récents');
          }
          return response.data as MandateData[];
        },
        forceRefresh
      );

      if (recentData) {
        const recentMandates = recentData.slice(0, 5).map((mandate: MandateData) => ({
          id: mandate.id,
          clientName: `${mandate.formData.prenom} ${mandate.formData.nom}`,
          email: mandate.formData.email,
          status: mapBackendStatusToFrontend(mandate.status),
          statusText: mapBackendStatusToFrontend(mandate.status) === "pending" ? "En attente" :
                     mapBackendStatusToFrontend(mandate.status) === "validated" ? "Validé" : "Rejeté",
          createdAt: mandate.createdAt,
          department: mandate.formData.circonscription
        }));
        setRecentRequests(recentMandates);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des données du dashboard:", err);
      // Les erreurs sont déjà gérées par useApiCache
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const refreshData = () => {
    loadDashboardData(true);
  };

  return {
    stats,
    recentRequests,
    loading,
    error,
    refreshData
  };
}
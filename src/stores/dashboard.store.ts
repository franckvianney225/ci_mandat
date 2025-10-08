import { create } from 'zustand';
import { apiClient } from '@/lib/api';

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

interface ApiMandate {
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

interface DashboardStore {
  // State
  stats: DashboardStats;
  recentRequests: RecentRequest[];
  loading: boolean;
  error: string | null;
  lastLoadTime: number;

  // Actions
  loadDashboardData: (forceRefresh?: boolean) => Promise<void>;
  refreshData: () => Promise<void>;
  clearError: () => void;
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  // Initial state
  stats: {
    totalRequests: 0,
    validatedRequests: 0,
    pendingRequests: 0,
    rejectedRequests: 0,
    totalUsers: 0,
    activeUsers: 0
  },
  recentRequests: [],
  loading: false,
  error: null,
  lastLoadTime: 0,

  // Actions
  loadDashboardData: async (forceRefresh = false) => {
    const { lastLoadTime } = get();
    const now = Date.now();
    
    // Éviter les appels trop fréquents (minimum 30 secondes entre les appels)
    if (!forceRefresh && now - lastLoadTime < 30000 && lastLoadTime > 0) {
      console.log('Dashboard: Appel API évité (trop récent)');
      return;
    }

    set({ loading: true, error: null });

    try {
      // Charger les statistiques des mandats
      const statsResponse = await apiClient.getMandateStatistics();
      // Charger les mandats récents
      const mandatesResponse = await apiClient.getRecentMandates();
      
      if (statsResponse.success && statsResponse.data) {
        const statsData = statsResponse.data as MandateStatistics;
        // Calculer le total des demandes validées (admin_approved + super_admin_approved)
        const totalValidated = statsData.adminApproved + statsData.superAdminApproved;
        
        set({
          stats: {
            totalRequests: statsData.total,
            validatedRequests: totalValidated,
            pendingRequests: statsData.pending,
            rejectedRequests: statsData.rejected,
            totalUsers: 0,
            activeUsers: 0
          }
        });
      }

      if (mandatesResponse.success && mandatesResponse.data) {
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

        const recentMandates = (mandatesResponse.data as ApiMandate[]).slice(0, 5).map((mandate: ApiMandate) => ({
          id: mandate.id,
          clientName: `${mandate.formData.prenom} ${mandate.formData.nom}`,
          email: mandate.formData.email,
          status: mapBackendStatusToFrontend(mandate.status),
          statusText: mapBackendStatusToFrontend(mandate.status) === "pending" ? "En attente" :
                     mapBackendStatusToFrontend(mandate.status) === "validated" ? "Validé" : "Rejeté",
          createdAt: mandate.createdAt,
          department: mandate.formData.circonscription
        }));

        set({ 
          recentRequests: recentMandates,
          lastLoadTime: now,
          loading: false 
        });
      }
    } catch (error) {
      console.error("Erreur lors du chargement du dashboard:", error);
      set({ 
        error: "Erreur lors du chargement des données",
        loading: false 
      });
    }
  },

  refreshData: async () => {
    await get().loadDashboardData(true);
  },

  clearError: () => set({ error: null })
}));
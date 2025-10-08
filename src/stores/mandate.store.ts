import { create } from 'zustand';
import { apiClient } from '@/lib/api';

export interface StoreMandate {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  circonscription: string;
  status: "pending" | "validated" | "rejected";
  createdAt: string;
  referenceNumber: string;
}

interface MandateFilters {
  search: string;
  status: string;
  department: string;
  page: number;
  limit: number;
}

interface CreateMandateData {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  circonscription: string;
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

interface MandateStore {
  // State
  mandates: StoreMandate[];
  selectedMandate: StoreMandate | null;
  loading: boolean;
  error: string | null;
  filters: MandateFilters;
  totalPages: number;
  totalItems: number;

  // Actions
  loadMandates: (filters?: Partial<MandateFilters>) => Promise<void>;
  loadMandate: (id: string) => Promise<void>;
  validateMandate: (id: string) => Promise<void>;
  rejectMandate: (id: string, reason: string) => Promise<void>;
  deleteMandate: (id: string) => Promise<void>;
  createMandate: (data: CreateMandateData) => Promise<void>;
  updateFilters: (filters: Partial<MandateFilters>) => void;
  clearError: () => void;
}

export const useMandateStore = create<MandateStore>((set, get) => ({
  // Initial state
  mandates: [],
  selectedMandate: null,
  loading: false,
  error: null,
  filters: {
    search: '',
    status: 'all',
    department: 'all',
    page: 1,
    limit: 15
  },
  totalPages: 1,
  totalItems: 0,

  // Actions
  loadMandates: async (newFilters) => {
    const { filters } = get();
    const mergedFilters = { ...filters, ...newFilters };
    
    set({ loading: true, error: null });
    
    try {
      const response = await apiClient.getMandates(mergedFilters);
      
      if (response.success && response.data) {
        // Fonction pour mapper les statuts backend vers frontend
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

        // Transformer les données de l'API en format StoreMandate
        const mandates = response.data.data.map((mandate: ApiMandate) => ({
          id: mandate.id,
          nom: mandate.formData.nom,
          prenom: mandate.formData.prenom,
          email: mandate.formData.email,
          telephone: mandate.formData.telephone,
          circonscription: mandate.formData.circonscription,
          status: mapBackendStatusToFrontend(mandate.status),
          createdAt: mandate.createdAt,
          referenceNumber: mandate.referenceNumber
        }));
        
        set({
          mandates,
          totalPages: response.data.totalPages,
          totalItems: response.data.totalItems,
          filters: mergedFilters,
          loading: false
        });
      } else {
        set({
          error: response.error || 'Erreur lors du chargement des mandats',
          loading: false
        });
      }
    } catch (error) {
      set({
        error: 'Erreur de connexion au serveur',
        loading: false
      });
    }
  },

  loadMandate: async (id: string) => {
    // Implémentation à venir
    console.log('loadMandate not implemented yet');
  },

  createMandate: async (data: CreateMandateData) => {
    // Implémentation à venir
    console.log('createMandate not implemented yet');
  },

  validateMandate: async (id: string) => {
    try {
      await apiClient.validateMandateByAdmin(id);
      // Recharger les données après validation
      await get().loadMandates();
    } catch (error) {
      set({ error: 'Erreur lors de la validation du mandat' });
    }
  },

  rejectMandate: async (id: string, reason: string) => {
    try {
      await apiClient.rejectMandate(id, reason);
      await get().loadMandates();
    } catch (error) {
      set({ error: 'Erreur lors du rejet du mandat' });
    }
  },

  deleteMandate: async (id: string) => {
    try {
      await apiClient.deleteMandate(id);
      await get().loadMandates();
    } catch (error) {
      set({ error: 'Erreur lors de la suppression du mandat' });
    }
  },

  updateFilters: (newFilters) => {
    const { filters } = get();
    set({ filters: { ...filters, ...newFilters, page: 1 } });
  },

  clearError: () => set({ error: null })
}));
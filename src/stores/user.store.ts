import { create } from 'zustand';
import { apiClient } from '@/lib/api';

interface User {
  id: string;
  email: string;
  role: "admin" | "super_admin";
  status: "active" | "inactive" | "suspended" | "pending_verification";
  personalData: {
    firstName: string;
    lastName: string;
    phone?: string;
    department?: string;
  };
  createdAt: string;
  lastLogin?: string;
  loginAttempts: number;
}

interface UserFilters {
  search: string;
  role: string;
  status: string;
  page: number;
  limit: number;
}

interface CreateUserData {
  email: string;
  password: string;
  role: "admin" | "super_admin";
  personalData: {
    firstName: string;
    lastName: string;
    phone?: string;
    department?: string;
  };
}

interface UpdateUserData {
  email: string;
  role: "admin" | "super_admin";
  status: "active" | "inactive" | "suspended" | "pending_verification";
  personalData: {
    firstName: string;
    lastName: string;
    phone?: string;
    department?: string;
  };
}

interface UserStore {
  // State
  users: User[];
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  filters: UserFilters;
  totalPages: number;
  totalItems: number;

  // Actions
  loadUsers: (filters?: Partial<UserFilters>) => Promise<void>;
  loadCurrentUser: () => Promise<void>;
  createUser: (userData: CreateUserData) => Promise<void>;
  updateUser: (id: string, userData: UpdateUserData) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  resetPassword: (id: string, newPassword: string) => Promise<void>;
  updateFilters: (filters: Partial<UserFilters>) => void;
  clearError: () => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
  // Initial state
  users: [],
  currentUser: null,
  loading: false,
  error: null,
  filters: {
    search: '',
    role: 'all',
    status: 'all',
    page: 1,
    limit: 10
  },
  totalPages: 1,
  totalItems: 0,

  // Actions
  loadUsers: async (newFilters) => {
    const { filters } = get();
    const mergedFilters = { ...filters, ...newFilters };
    
    set({ loading: true, error: null });
    
    try {
      const response = await apiClient.getUsers(mergedFilters);
      
      if (response.success && response.data) {
        set({
          users: response.data.data,
          totalPages: response.data.totalPages,
          totalItems: response.data.totalItems,
          filters: mergedFilters,
          loading: false
        });
      } else {
        set({ 
          error: response.error || 'Erreur lors du chargement des utilisateurs',
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

  loadCurrentUser: async () => {
    try {
      const response = await apiClient.verifyToken();
      if (response.success && response.data) {
        set({ currentUser: response.data.user as unknown as User });
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'utilisateur courant:', error);
    }
  },

  createUser: async (userData: CreateUserData) => {
    try {
      const response = await apiClient.createUser(userData);
      if (response.success) {
        // Recharger la liste des utilisateurs
        await get().loadUsers();
      } else {
        set({ error: response.error || 'Erreur lors de la création de l\'utilisateur' });
      }
    } catch (error) {
      set({ error: 'Erreur de connexion au serveur' });
    }
  },

  updateUser: async (id: string, userData: UpdateUserData) => {
    try {
      const response = await apiClient.updateUser(id, userData);
      if (response.success) {
        await get().loadUsers();
      } else {
        set({ error: response.error || 'Erreur lors de la modification de l\'utilisateur' });
      }
    } catch (error) {
      set({ error: 'Erreur de connexion au serveur' });
    }
  },

  deleteUser: async (id: string) => {
    try {
      const response = await apiClient.deleteUser(id);
      if (response.success) {
        await get().loadUsers();
      } else {
        set({ error: response.error || 'Erreur lors de la suppression de l\'utilisateur' });
      }
    } catch (error) {
      set({ error: 'Erreur de connexion au serveur' });
    }
  },

  resetPassword: async (id: string, newPassword: string) => {
    try {
      const response = await apiClient.resetUserPassword(id, newPassword);
      if (!response.success) {
        set({ error: response.error || 'Erreur lors de la modification du mot de passe' });
      }
    } catch (error) {
      set({ error: 'Erreur de connexion au serveur' });
    }
  },

  updateFilters: (newFilters) => {
    const { filters } = get();
    set({ filters: { ...filters, ...newFilters, page: 1 } });
  },

  clearError: () => set({ error: null })
}));
// Service API pour communiquer avec le backend NestJS

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface User {
  id: string;
  email: string;
  role: "admin" | "super_admin";
  status: "active" | "inactive" | "suspended" | "pending_verification";
  personalData: {
    firstName: string;
    lastName: string;
    phone?: string;
  };
  createdAt: string;
  lastLogin?: string;
  loginAttempts: number;
}

interface AuthUser {
  id: string;
  email: string;
  role: "admin" | "super_admin";
  status: "active" | "inactive" | "suspended" | "pending_verification";
  personalData: {
    firstName: string;
    lastName: string;
    phone?: string;
  };
  createdAt: string;
  lastLogin?: string;
  loginAttempts: number;
}

interface Request {
  id: string;
  clientName: string;
  email: string;
  status: "pending" | "validated" | "rejected";
  createdAt: string;
  department: string;
}

interface PaginatedResponse<T> {
  data: T[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
}

interface DashboardStats {
  totalRequests: number;
  validatedRequests: number;
  pendingRequests: number;
  rejectedRequests: number;
  totalUsers: number;
  activeUsers: number;
}

interface Mandate {
  id: string;
  title: string;
  description: string;
  referenceNumber: string;
  formData: {
    nom: string;
    prenom: string;
    fonction: string;
    email: string;
    telephone: string;
    circonscription: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateMandateDto {
  nom: string;
  prenom: string;
  fonction: string;
  email: string;
  telephone: string;
  circonscription: string;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Toujours envoyer les cookies
      ...options,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      if (!response.ok) {
        // Récupérer les données d'erreur détaillées du backend
        let errorData: any = null;
        try {
          errorData = await response.json();
        } catch {
          // Si le backend ne retourne pas de JSON, utiliser le message par défaut
          errorData = { message: `HTTP error! status: ${response.status}` };
        }
        
        // Créer une erreur avec les données détaillées
        const error = new ApiError(response.status, errorData.message || `HTTP error! status: ${response.status}`);
        (error as any).responseData = errorData;
        throw error;
      }

      const data = await response.json();
      
      // Le backend retourne directement les données, pas une structure ApiResponse
      // On adapte la réponse pour correspondre à l'interface ApiResponse
      if (data.success !== undefined) {
        // Si le backend retourne déjà une structure ApiResponse
        return data;
      } else {
        // Si le backend retourne directement les données
        return {
          success: true,
          data: data
        };
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, 'Network error occurred');
    }
  }

  // Supprimer la méthode getToken() qui lisait depuis localStorage
  // Les cookies sont maintenant gérés automatiquement par le navigateur

  // Users API
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }): Promise<ApiResponse<PaginatedResponse<User>>> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.role && params.role !== 'all') queryParams.append('role', params.role);
    if (params?.status && params.status !== 'all') queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    const endpoint = `/users${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  async createUser(userData: {
    email: string;
    password: string;
    role: 'admin' | 'super_admin';
    personalData: {
      firstName: string;
      lastName: string;
      phone?: string;
    };
  }): Promise<ApiResponse> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(
    userId: string,
    userData: {
      email: string;
      role: 'admin' | 'super_admin';
      status: 'active' | 'inactive' | 'suspended' | 'pending_verification';
      personalData: {
        firstName: string;
        lastName: string;
        phone?: string;
      };
    }
  ): Promise<ApiResponse> {
    return this.request(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId: string): Promise<ApiResponse> {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async resetUserPassword(userId: string, newPassword: string): Promise<ApiResponse> {
    return this.request(`/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  }

  // Auth API
  async login(credentials: { email: string; password: string }): Promise<ApiResponse<{ access_token: string; user: AuthUser }>> {
    console.log('🔐 Données envoyées au backend:', credentials);
    console.log('🔐 Corps de la requête:', JSON.stringify(credentials));
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async verifyToken(): Promise<ApiResponse<{ user: AuthUser }>> {
    return this.request('/auth/profile');
  }

  async logout(): Promise<ApiResponse> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async updateProfile(profileData: {
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<ApiResponse> {
    return this.request('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
  }

  // Dashboard API
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request('/dashboard/stats');
  }

  async getRecentRequests(): Promise<ApiResponse<Request[]>> {
    return this.request('/dashboard/recent-requests');
  }

  // Requests API
  async getRequests(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<PaginatedResponse<Request>>> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status && params.status !== 'all') queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const endpoint = `/requests${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  async validateRequest(requestId: string): Promise<ApiResponse> {
    return this.request(`/requests/${requestId}/validate`, {
      method: 'PATCH',
    });
  }

  async rejectRequest(requestId: string, reason?: string): Promise<ApiResponse> {
    return this.request(`/requests/${requestId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  // Settings API
  async getEmailConfig(): Promise<ApiResponse<{
    smtpHost: string;
    smtpPort: string;
    smtpUsername: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
    useSSL: boolean;
    useTLS: boolean;
  }>> {
    return this.request('/settings/email');
  }

  async updateEmailConfig(config: {
    smtpHost: string;
    smtpPort: string;
    smtpUsername: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
    useSSL: boolean;
    useTLS: boolean;
  }): Promise<ApiResponse> {
    return this.request('/settings/email', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async testEmailConnection(config: {
    smtpHost: string;
    smtpPort: string;
    smtpUsername: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
    useSSL: boolean;
    useTLS: boolean;
  }): Promise<ApiResponse> {
    return this.request('/settings/email/test', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async sendTestEmail(config: {
    smtpHost: string;
    smtpPort: string;
    smtpUsername: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
    useSSL: boolean;
    useTLS: boolean;
  }, testEmail: string): Promise<ApiResponse> {
    return this.request('/settings/email/send-test', {
      method: 'POST',
      body: JSON.stringify({
        ...config,
        testEmail
      }),
    });
  }

  // Mandates API
  async createMandate(mandateData: CreateMandateDto): Promise<ApiResponse<Mandate>> {
    return this.request('/mandates', {
      method: 'POST',
      body: JSON.stringify(mandateData),
    });
  }

  async getMandates(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<ApiResponse<PaginatedResponse<Mandate>>> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status && params.status !== 'all') queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    const endpoint = `/mandates${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  async getMandateStatistics(): Promise<ApiResponse<{
    total: number;
    pending: number;
    adminApproved: number;
    superAdminApproved: number;
    rejected: number;
  }>> {
    return this.request('/mandates/statistics');
  }

  async getRecentMandates(): Promise<ApiResponse<Mandate[]>> {
    return this.request('/mandates/recent');
  }

  async validateMandateByAdmin(mandateId: string): Promise<ApiResponse> {
    return this.request(`/mandates/${mandateId}/validate-admin`, {
      method: 'PATCH',
    });
  }

  async validateMandateBySuperAdmin(mandateId: string): Promise<ApiResponse> {
    return this.request(`/mandates/${mandateId}/validate-super-admin`, {
      method: 'PATCH',
    });
  }

  async rejectMandate(mandateId: string, reason: string): Promise<ApiResponse> {
    return this.request(`/mandates/${mandateId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  async generateMandatePDF(mandateId: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/mandates/${mandateId}/pdf`, {
      method: 'GET',
      credentials: 'include', // Envoyer les cookies automatiquement
    });
    
    if (!response.ok) {
      throw new ApiError(response.status, `HTTP error! status: ${response.status}`);
    }
    
    return await response.blob();
  }
}

export const apiClient = new ApiClient();
export { ApiError };

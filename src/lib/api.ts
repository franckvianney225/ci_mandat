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
  personalData: {
    firstName: string;
    lastName: string;
  };
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
    const token = this.getToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      if (!response.ok) {
        throw new ApiError(response.status, `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, 'Network error occurred');
    }
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('adminToken');
    }
    return null;
  }

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

  // Auth API
  async login(credentials: { email: string; password: string }): Promise<ApiResponse<{ token: string; user: AuthUser }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async verifyToken(): Promise<ApiResponse<{ user: AuthUser }>> {
    return this.request('/auth/verify');
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
  async getSettings(): Promise<ApiResponse<unknown>> {
    return this.request('/settings');
  }

  async updateSettings(settings: unknown): Promise<ApiResponse> {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async testEmailConnection(config: unknown): Promise<ApiResponse> {
    return this.request('/settings/test-email', {
      method: 'POST',
      body: JSON.stringify(config),
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
}

export const apiClient = new ApiClient();
export { ApiError };

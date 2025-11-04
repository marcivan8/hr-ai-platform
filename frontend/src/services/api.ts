import axios, { AxiosInstance } from 'axios';
import { IRequest, User, AuthResponse, DashboardStats } from '../types';

const API_URL = process.env.VITE_API_URL || 'https://hr-ai-platform.onrender.com/api';

// Instance Axios principale
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Intercepteur pour ajouter le token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
api.interceptors.response.use(
  (response) => {
    // Log successful auth responses for debugging
    if (response.config.url?.includes('/auth/')) {
      console.log('Auth response:', {
        url: response.config.url,
        data: response.data,
        hasToken: !!response.data?.token,
        hasUser: !!response.data?.user,
        userRole: response.data?.user?.role
      });
    }
    return response;
  },
  (error) => {
    // Enhanced error logging
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API d'authentification
export const authAPI = {
  login: (email: string, password: string) => 
    api.post<AuthResponse>('/auth/login', { email, password }),
  
  register: (data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    position?: string;
    department?: string;
  }) => api.post<AuthResponse>('/auth/register', data),
  
  getProfile: () => api.get<User>('/auth/profile'),
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// API des requêtes
export const requestAPI = {
  // Créer une nouvelle requête
  createRequest: (data: {
    type?: string;
    requestType?: string;
    title: string;
    description: string;
    isAnonymous?: boolean;
  }) => api.post<{ ok: boolean; request: IRequest }>('/requests', data),
  
  // Envoyer un message dans une conversation
  sendMessage: (requestId: string, message: string) => 
    api.post(`/requests/${requestId}/messages`, { message }),
  
  // Finaliser une requête
  finalizeRequest: (requestId: string, structuredData: any) => 
    api.post(`/requests/${requestId}/finalize`, { structuredData }),
  
  // Obtenir mes requêtes
  getMyRequests: () => api.get<IRequest[]>('/requests'),
  
  // Obtenir une requête par ID
  getRequestById: (requestId: string) => 
    api.get<IRequest>(`/requests/${requestId}`),
  
  // Obtenir toutes les requêtes (pour RH)
  getAllRequestsForHR: (filters?: any) => 
    api.get<{ requests: IRequest[] }>('/requests', { params: filters }),
  
  // Mettre à jour le statut d'une requête (RH)
  updateRequestStatus: (requestId: string, data: {
    status?: string;
    hrNotes?: string;
    priority?: string;
  }) => api.put(`/requests/${requestId}/status`, data),
  
  // Exporter en PDF
  exportPDF: (requestId: string) => 
    api.get(`/requests/${requestId}/pdf`, { responseType: 'blob' })
};

// Helper for creating a request when you have an employeeId available
export interface IRequestPayload {
  employeeId: string;       // MongoDB ObjectId string
  title: string;
  description: string;
  requestType?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export async function createRequest(payload: IRequestPayload) {
  // Key points:
  // 1. employeeId cannot be null or undefined — your backend requires it.
  // 2. title and description are mandatory.
  // 3. Optional: requestType and priority.
  // 4. We post to '/requests/create' (baseURL already includes '/api'), so ensure VITE_API_URL is correct.
  if (!payload.employeeId || !payload.title || !payload.description) {
    throw new Error('Missing required fields: employeeId, title, or description');
  }

  try {
    const response = await api.post('/requests/create', payload);
    return response.data;
  } catch (err: any) {
    console.error('API Error:', err.response || err);
    throw err;
  }
}

// API du dashboard RH
export const hrAPI = {
  getStats: () => api.get<{
    data: {
      stats: DashboardStats;
      requestsByType: Array<{ _id: string; count: number }>;
    }
  }>('/hr/dashboard/stats'),
  
  getAllRequests: (filters?: {
    status?: string;
    priority?: string;
    requestType?: string;
    page?: number;
    limit?: number;
  }) => api.get<{ requests: IRequest[] }>('/requests', { params: filters }),
  
  reviewRequest: (requestId: string, data: {
    hrNotes?: string;
    status?: string;
    resolution?: {
      decision: string;
      feedback: string;
      actionTaken: string;
    };
  }) => api.put(`/requests/${requestId}/review`, data)
};

// Export par défaut
export default api;
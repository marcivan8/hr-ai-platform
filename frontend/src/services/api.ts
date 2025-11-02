import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile')
};

export const requestAPI = {
  createRequest: (requestType: string, isAnonymous: boolean = false) => api.post('/requests', { requestType, isAnonymous }),
  sendMessage: (requestId: string, message: string) => api.post(`/requests/${requestId}/messages`, { message }),
  finalizeRequest: (requestId: string, structuredData: any) => api.post(`/requests/${requestId}/finalize`, { structuredData }),
  getMyRequests: () => api.get('/requests/my-requests'),
  getRequestById: (requestId: string) => api.get(`/requests/${requestId}`),
  getAllRequestsForHR: (filters?: any) => api.get('/requests/hr/all', { params: filters }),
  updateRequestStatus: (requestId: string, data: any) => api.put(`/requests/hr/${requestId}/status`, data)
};

export default api;
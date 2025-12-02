import axios from 'axios';

export const api = axios.create({
  // Use relative base URL so:
  // - Dev: Vite proxy forwards /api to backend
  // - Prod: same-origin to Express
  baseURL: '',
  withCredentials: true,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(
  (config) => {
    if (import.meta.env.MODE === 'development') {
      console.log('📡 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data
      });
    }
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    if (import.meta.env.MODE === 'development') {
      console.log('✅ API Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  (error) => {
    if (import.meta.env.MODE === 'development') {
      console.error('❌ API Error:', {
        url: error.config?.url,
        message: error.message,
        response: error.response?.data
      });
    }
    if (error.response?.status === 401) {
      console.log('Unauthorized request, clearing auth');
    }
    return Promise.reject(error);
  }
);

export default api;
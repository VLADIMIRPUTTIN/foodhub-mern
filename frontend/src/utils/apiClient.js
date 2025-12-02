import axios from 'axios';

// Determine base URL based on environment
const getBaseURL = () => {
  // Check if we're in development mode
  if (import.meta.env.MODE === 'development') {
    return 'http://localhost:5000';
  }
  // Production uses relative URLs (same origin)
  return '';
};

// Create axios instance with proper configuration
export const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true, // CRITICAL: Send cookies with every request
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor to attach token if needed
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('Unauthorized request, clearing auth');
    }
    return Promise.reject(error);
  }
);

export default api;
import axios from 'axios';
import { env } from '../config/env';

/**
 * Global Axios instance for API communication
 */
export const api = axios.create({
  baseURL: env.VITE_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging or auth
api.interceptors.request.use(
  (config) => {
    // Add auth token here if needed
    // const token = localStorage.getItem('token');
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Unknown API Error';
    console.error(`[API Error] ${message}`, error);
    
    // We could trigger a toast here if we had access to the context,
    // but usually it's better to handle it in the hook/component.
    
    return Promise.reject(error);
  }
);

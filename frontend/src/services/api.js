import axios from 'axios';

// Base API URL - Update this with your deployed backend URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Products API
export const getProducts = () => api.get('/api/products');

export const searchProducts = (query) => api.get(`/api/products/search?name=${query}`);

export const getProductById = (id) => api.get(`/api/products/${id}`);

export const createProduct = (productData) => api.post('/api/products', productData);

export const updateProduct = (id, productData) => api.put(`/api/products/${id}`, productData);

export const deleteProduct = (id) => api.delete(`/api/products/${id}`);

// Import/Export API
export const importProducts = (formData) => {
  return api.post('/api/products/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const exportProducts = () => {
  return api.get('/api/products/export', {
    responseType: 'blob',
  });
};

// Inventory History API
export const getProductHistory = (id) => api.get(`/api/products/${id}/history`);

// Authentication API
export const login = (email, password) => api.post('/api/auth/login', { email, password });

export const register = (username, email, password) =>
  api.post('/api/auth/register', { username, email, password });

export const getCurrentUser = () => api.get('/api/auth/me');

export default api;

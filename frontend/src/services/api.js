import axios from 'axios';
import { storiesData } from '../data/storiesData';
import { highlightsData } from '../data/highlightsData';
import { mockPets } from '../data/mockPets';
import { adminStats, mockUsers, mockTracking, mockDocuments, mockPosts } from '../data/adminMockData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 seconds to allow serverless db cold starts
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    try {
      const state = localStorage.getItem('straycare_user');
      if (state) {
        const parsed = JSON.parse(state);
        const token = parsed.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (err) {
      console.error('Error setting auth header:', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 Unauthorized and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Read refresh token from localStorage to avoid circular dependency
        let refreshToken = null;
        const state = localStorage.getItem('straycare_user');
        if (state) {
          const parsed = JSON.parse(state);
          refreshToken = parsed.state?.refreshToken;
        }

        if (refreshToken) {
          // Request a new token using standard axios to avoid interceptor loop
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const newToken = response.data.token;
          
          // Dynamically import store to update state reactively
          const { useAuthStore } = await import('../store/authStore');
          useAuthStore.getState().setToken(newToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        console.error('Session expired, logging out:', refreshError);
        const { useAuthStore } = await import('../store/authStore');
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

let isBackendAvailable = false;

// Check backend availability
export const checkBackend = async () => {
  try {
    // Attempt to ping the health or a simple endpoint
    await axios.get(`${API_BASE_URL}/auth/health`, { timeout: 15000 });
    isBackendAvailable = true;
    console.log('Backend connected successfully');
    return true;
  } catch (error) {
    isBackendAvailable = false;
    console.warn('Backend not reachable, using mock data');
    return false;
  }
};

// Initial check
checkBackend();

export const getStories = async () => {
  if (!isBackendAvailable) return storiesData;
  try {
    const response = await apiClient.get('/feed/stories');
    return response.data;
  } catch (error) {
    return storiesData;
  }
};

export const getPets = async () => {
  if (!isBackendAvailable) return mockPets;
  try {
    const response = await apiClient.get('/adoptions/pets');
    return response.data.data || response.data;
  } catch (error) {
    return mockPets;
  }
};

export const getHighlights = async () => {
  if (!isBackendAvailable) return highlightsData;
  try {
    const response = await apiClient.get('/feed/highlights');
    return response.data;
  } catch (error) {
    return highlightsData;
  }
};

// Admin Endpoints
export const getAdminStats = async () => {
  if (!isBackendAvailable) return adminStats;
  try {
    const response = await apiClient.get('/admin/stats');
    return response.data;
  } catch (error) {
    return adminStats;
  }
};

export const getAdminUsers = async () => {
  if (!isBackendAvailable) return mockUsers;
  try {
    const response = await apiClient.get('/admin/users');
    return response.data;
  } catch (error) {
    return mockUsers;
  }
};

export const getAdminTracking = async () => {
  if (!isBackendAvailable) return mockTracking;
  try {
    const response = await apiClient.get('/admin/tracking');
    return response.data;
  } catch (error) {
    return mockTracking;
  }
};

export const getAdminDocs = async () => {
  if (!isBackendAvailable) return mockDocuments;
  try {
    const response = await apiClient.get('/admin/documents');
    return response.data;
  } catch (error) {
    return mockDocuments;
  }
};

export const updateAdminUserStatus = async (id, status) => {
  const response = await apiClient.patch(`/admin/users/${id}/status`, { status });
  return response.data;
};

export const getAdminPosts = async () => {
  if (!isBackendAvailable) return mockPosts;
  try {
    const response = await apiClient.get('/admin/posts');
    return response.data;
  } catch (error) {
    return mockPosts;
  }
};

export const updateAdminPostStatus = async (id, status) => {
  const response = await apiClient.patch(`/admin/posts/${id}/status`, { status });
  return response.data;
};

export const deleteAdminPost = async (id) => {
  const response = await apiClient.delete(`/admin/posts/${id}`);
  return response.data;
};

export default apiClient;

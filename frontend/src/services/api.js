import axios from 'axios';
import { storiesData } from '../data/storiesData';
import { highlightsData } from '../data/highlightsData';
import { mockPets } from '../data/mockPets';

// Inline mock data fallbacks for admin portal (to avoid importing deleted adminMockData.js)
const adminStats = {
  adoptions: 12,
  rescues: 24,
  urgentReports: 8,
  funding: "₹45,200",
  month: "April 2026"
};

const mockUsers = [
  { id: 1, name: 'Helping Paws NGO', email: 'contact@helpingpaws.org', role: 'ngo', status: 'Active', joined: '2025-10-12' },
  { id: 2, name: 'City Vet Clinic', email: 'dr.smith@cityvet.com', role: 'partner', status: 'Active', joined: '2025-12-05' },
  { id: 3, name: 'Rescue Rangers', email: 'info@rrangers.org', role: 'ngo', status: 'Pending', joined: '2026-03-08' },
  { id: 4, name: 'Abhigyan Kumar', email: 'abhigyan@example.com', role: 'user', status: 'Active', joined: '2026-04-01' },
  { id: 5, name: 'Dr. Rahul Sharma', email: 'rahul@vetclinic.com', role: 'partner', status: 'Active', joined: '2026-04-10' },
];

const mockDocuments = [
  { id: 'DOC-101', title: 'Medical History - Bella', type: 'PDF', size: '2.4 MB', date: '2026-03-08' },
  { id: 'DOC-102', title: 'Adoption Agreement Form', type: 'DOCX', size: '1.1 MB', date: '2026-03-01' },
  { id: 'DOC-103', title: 'NGO Verification - Helping Paws', type: 'PDF', size: '3.5 MB', date: '2026-02-15' }
];

const mockTracking = [
  { id: 'TRK-001', name: "Bella (Stray)", type: "Dog", reporter: "John Doe", status: "Reported", date: "2026-03-08", location: "Downtown Park" },
  { id: 'TRK-002', name: "Luna", type: "Cat", reporter: "Jane Smith", status: "Rescue in Progress", date: "2026-03-07", location: "Northside Alley" },
  { id: 'TRK-003', name: "Max", type: "Dog", reporter: "Mike Ross", status: "At Clinic", date: "2026-03-05", location: "East Ave" },
];

const mockPosts = [
  { id: 1, author: 'Jane Smith', authorAvatar: 'https://i.pravatar.cc/150?u=jane', content: 'Found a stray dog near Central Park. Please share! He looks hungry but friendly.', date: '2 hours ago', status: 'Published', reports: 0 },
  { id: 2, author: 'John Doe', authorAvatar: 'https://i.pravatar.cc/150?u=john', content: 'Here are some tips for fostering cats in summer. Keep them hydrated and avoid direct sun during peak hours.', date: '5 hours ago', status: 'Published', reports: 0 },
  { id: 3, author: 'SpamBot', authorAvatar: 'https://i.pravatar.cc/150?u=spam', content: 'Click here for free dog food!!! Limited time offer! NO SCAM!! 100% REAL!!', date: '1 day ago', status: 'Reported', reports: 12 },
  { id: 4, author: 'Mike Ross', authorAvatar: 'https://i.pravatar.cc/150?u=mike', content: 'Aggressive dog spotted near the subway entrance. Be careful everyone.', date: '3 days ago', status: 'Pending', reports: 2 }
];

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
  try {
    const response = await apiClient.get('/feed/stories');
    return response.data;
  } catch (error) {
    console.warn('Failed to fetch stories, using mock data:', error.message);
    return storiesData;
  }
};

export const getPets = async () => {
  try {
    const response = await apiClient.get('/adoptions/pets');
    return response.data.data || response.data;
  } catch (error) {
    console.warn('Failed to fetch pets, using mock data:', error.message);
    return mockPets;
  }
};

export const getHighlights = async () => {
  try {
    const response = await apiClient.get('/feed/highlights');
    return response.data;
  } catch (error) {
    console.warn('Failed to fetch highlights, using mock data:', error.message);
    return highlightsData;
  }
};

export const registerPartner = async (partnerData) => {
  const response = await apiClient.post('/auth/register-partner', partnerData);
  return response.data;
};

// Admin Endpoints
export const getAdminStats = async () => {
  try {
    const response = await apiClient.get('/admin/stats');
    return response.data;
  } catch (error) {
    console.warn('Failed to fetch admin stats, using mock data:', error.message);
    return adminStats;
  }
};

export const getAdminUsers = async () => {
  try {
    const response = await apiClient.get('/admin/users');
    return response.data;
  } catch (error) {
    console.warn('Failed to fetch admin users, using mock data:', error.message);
    return mockUsers;
  }
};

export const getPartnerApplications = async () => {
  try {
    const response = await apiClient.get('/admin/partner-applications');
    return response.data;
  } catch (error) {
    console.warn('Failed to fetch partner applications, returning empty:', error.message);
    return [];
  }
};

export const getAdminTracking = async () => {
  try {
    const response = await apiClient.get('/admin/tracking');
    return response.data;
  } catch (error) {
    console.warn('Failed to fetch admin tracking, using mock data:', error.message);
    return mockTracking;
  }
};

export const getAdminDocs = async () => {
  try {
    const response = await apiClient.get('/admin/documents');
    return response.data;
  } catch (error) {
    console.warn('Failed to fetch admin documents, using mock data:', error.message);
    return mockDocuments;
  }
};

export const updateAdminUserStatus = async (id, status) => {
  const response = await apiClient.patch(`/admin/users/${id}/status`, { status });
  return response.data;
};

export const deleteAdminUser = async (id) => {
  const response = await apiClient.delete(`/admin/users/${id}`);
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

export const getAdminReports = async (start, end) => {
  try {
    const params = {};
    if (start) params.start = start;
    if (end) params.end = end;
    const response = await apiClient.get('/admin/reports', { params });
    return response.data;
  } catch (error) {
    console.warn('Failed to fetch admin reports, using mock data:', error.message);
    return {
      adoptions: "156",
      rescues: "432",
      userGrowth: "+15%",
      donations: "₹2,84,500",
      campaigns: [
        { id: 'c-1', name: 'Summer Water Bowl Drive', goal: '₹50,000', raised: '₹42,000', status: 'Active', efficiency: '84%' },
        { id: 'c-2', name: 'Central Park Rescue Center', goal: '₹5,00,000', raised: '₹2,10,000', status: 'Ongoing', efficiency: '42%' }
      ]
    };
  }
};

export default apiClient;

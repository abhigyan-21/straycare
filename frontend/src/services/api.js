import axios from 'axios';
import { storiesData } from '../data/storiesData';
import { highlightsData } from '../data/highlightsData';
import { mockPets } from '../data/mockPets';
import { adminStats, mockUsers, mockTracking, mockDocuments } from '../data/adminMockData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 3000, // Short timeout to quickly fall back to mock data
});

let isBackendAvailable = false;

// Check backend availability
export const checkBackend = async () => {
  try {
    // Attempt to ping the health or a simple endpoint
    await axios.get(`${API_BASE_URL}/auth/health`, { timeout: 1000 });
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
    return response.data;
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

export default apiClient;

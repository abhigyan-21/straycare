import axios from 'axios';
import { storiesData } from '../data/storiesData';
import { highlightsData } from '../data/highlightsData';
import { mockPets } from '../data/mockPets';

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

export default apiClient;

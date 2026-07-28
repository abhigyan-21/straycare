import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 seconds to allow serverless db cold starts
});

export const unwrapApiData = (payload, fallback = []) => {
  if (payload?.status === 'success' && payload.data !== undefined) {
    return payload.data;
  }
  return payload ?? fallback;
};

export const getCampaignEndDate = (campaign) => campaign?.deadline || campaign?.endDate || null;

export const isActiveCampaign = (campaign) => {
  const status = String(campaign?.status || '').toUpperCase();
  const isStatusActive = !status || status === 'ACTIVE' || status === 'APPROVED';

  if (!isStatusActive) return false;

  const endDate = campaign?.deadline || campaign?.endDate;
  if (endDate) {
    const limitDate = new Date(endDate);
    limitDate.setDate(limitDate.getDate() + 1);
    limitDate.setHours(23, 59, 59, 999);
    if (new Date() > limitDate) {
      return false;
    }
  }
  return true;
};

export const getPartner = (entity) => entity?.partner || entity?.clinic || null;

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
        } else {
          console.warn('No refresh token available, logging out.');
          const { useAuthStore } = await import('../store/authStore');
          useAuthStore.getState().logout();
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

export const getUserAdoptionRequests = async () => {
  try {
    const response = await apiClient.get('/adoptions/requests');
    return response.data?.data || response.data || [];
  } catch (error) {
    console.warn('Failed to fetch user adoption requests:', error.message);
    return [];
  }
};

export const cancelAdoptionRequest = async (petId) => {
  const response = await apiClient.delete(`/adoptions/requests/pet/${petId}`);
  return response.data;
};

export const fetchPosts = async (page = 1, limit = 10) => {
  const response = await apiClient.get('/posts', {
    params: { page, limit }
  });
  return response.data;
};

export const getPostById = async (id) => {
  const response = await apiClient.get(`/posts/${id}`);
  return response.data;
};

export const createPost = async (formData) => {
  const response = await apiClient.post('/posts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const toggleLikePost = async (postId) => {
  const response = await apiClient.post(`/posts/${postId}/like`);
  return response.data;
};

export const addCommentToPost = async (postId, text) => {
  const response = await apiClient.post(`/posts/${postId}/comment`, { text });
  return response.data;
};

export const deleteComment = async (commentId) => {
  const response = await apiClient.delete(`/posts/comment/${commentId}`);
  return response.data;
};

export const reportPost = async (postId) => {
  const response = await apiClient.post(`/posts/${postId}/report`);
  return response.data;
};

export default apiClient;

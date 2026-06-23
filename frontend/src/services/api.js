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




export const getStories = async () => {
  try {
    const response = await apiClient.get('/feed/stories');
    return response.data;
  } catch (error) {
    console.warn('Failed to fetch stories:', error.message);
    return [];
  }
};

export const getPets = async (lat, lng, maxDistance) => {
  try {
    const params = {};
    if (lat !== undefined && lng !== undefined) {
      params.lat = lat;
      params.lng = lng;
    }
    if (maxDistance !== undefined) {
      params.maxDistance = maxDistance;
    }
    const response = await apiClient.get('/adoptions/pets', { params });
    return response.data.data || response.data;
  } catch (error) {
    console.warn('Failed to fetch pets:', error.message);
    return [];
  }
};

export const sendRegistrationOtp = async (email) => {
  const response = await apiClient.post('/auth/send-registration-otp', { email });
  return response.data;
};

export const verifyRegistrationOtp = async (email, otp, verificationToken) => {
  const response = await apiClient.post('/auth/verify-registration-otp', { email, otp, verificationToken });
  return response.data;
};

export const registerPartner = async (partnerData) => {
  const response = await apiClient.post('/auth/register-partner', partnerData);
  return response.data;
};

export const getProfile = async () => {
  const response = await apiClient.get('/users/profile');
  return response.data;
};

export const getClinicPets = async () => {
  try {
    const response = await apiClient.get('/adoptions/clinic-pets');
    return response.data?.data || response.data || [];
  } catch (error) {
    console.warn('Failed to fetch clinic pets:', error.message);
    return [];
  }
};

export const updatePet = async (id, data) => {
  const response = await apiClient.patch(`/adoptions/pets/${id}`, data);
  return response.data;
};

// Admin Endpoints
export const getAdminStats = async () => {
  try {
    const response = await apiClient.get('/admin/stats');
    return response.data;
  } catch (error) {
    console.warn('Failed to fetch admin stats:', error.message);
    return { adoptions: 0, rescues: 0, urgentReports: 0, funding: '₹0', month: '' };
  }
};

export const getAdminUsers = async () => {
  try {
    const response = await apiClient.get('/admin/users');
    return response.data;
  } catch (error) {
    console.warn('Failed to fetch admin users:', error.message);
    return [];
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
    console.warn('Failed to fetch admin tracking:', error.message);
    return [];
  }
};

export const getAdminDocs = async () => {
  try {
    const response = await apiClient.get('/admin/documents');
    return response.data;
  } catch (error) {
    console.warn('Failed to fetch admin documents:', error.message);
    return [];
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

export const updateAdminUserRole = async (id, role) => {
  const response = await apiClient.put(`/admin/users/${id}/role`, { role });
  return response.data;
};

export const requestRescuerUpgradeOtp = async () => {
  const response = await apiClient.post('/users/upgrade-rescuer/request-otp');
  return response.data;
};

export const verifyRescuerUpgradeOtp = async (otp) => {
  const response = await apiClient.post('/users/upgrade-rescuer/verify-otp', { otp });
  return response.data;
};


export const getAdminPosts = async () => {
  try {
    const response = await apiClient.get('/admin/posts');
    return response.data;
  } catch (error) {
    console.warn('Failed to fetch admin posts:', error.message);
    return [];
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
    console.warn('Failed to fetch admin reports:', error.message);
    return { adoptions: '0', rescues: '0', userGrowth: '0%', donations: '₹0', campaigns: [] };
  }
};

export const getUserDocuments = async () => {
  const response = await apiClient.get('/medical/documents');
  return response.data;
};

export const uploadUserDocument = async (data) => {
  const response = await apiClient.post('/medical/documents', data);
  return response.data;
};

export const deleteUserDocument = async (id) => {
  const response = await apiClient.delete(`/medical/documents/${id}`);
  return response.data;
};

export const submitAdoptionRequest = async (petId, formDetails = {}) => {
  const response = await apiClient.post('/adoptions/requests', { petId, formDetails });
  return response.data;
};

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

export default apiClient;

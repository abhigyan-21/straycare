import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      isFirstLogin: false, // Flag for splash loader
      
      setToken: (token) => set({ token }),

      login: (userData) => {
        // Legacy setter for backwards compatibility with local mock workflows
        if (!userData.role) userData.role = 'USER';
        set({ isLoggedIn: true, user: userData, isFirstLogin: true });
      },

      loginAction: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.post('/auth/login', { email, password });
          const { token, refreshToken, user } = response.data;
          
          if (!user.role) user.role = 'USER';
          
          set({
            isLoggedIn: true,
            user,
            token,
            refreshToken,
            isFirstLogin: true,
            isLoading: false
          });
          return { success: true, user };
        } catch (error) {
          set({ isLoading: false });
          let errorMsg = 'Authentication failed';
          if (error.response && error.response.data) {
             errorMsg = error.response.data.error || error.response.data.message || 'Authentication failed';
          } else if (error.message) {
             errorMsg = error.message;
          }
          throw new Error(errorMsg);
        }
      },

      registerAction: async (name, email, phone, password) => {
        set({ isLoading: true });
        try {
          await apiClient.post('/auth/register', {
            name,
            email,
            phone,
            password
          });
        } catch (error) {
          set({ isLoading: false });
          let errorMsg = 'Registration failed';
          if (error.response && error.response.data) {
             errorMsg = error.response.data.error || error.response.data.message || 'Registration failed';
          } else if (error.message) {
             errorMsg = error.message;
          }
          throw new Error(errorMsg);
        }

        // Run auto-login outside the registration try-catch block
        // to preserve specific authentication errors
        set({ isLoading: false });
        return await get().loginAction(email, password);
      },

      verifyEmailAction: async (otp) => {
        set({ isLoading: true });
        try {
          await apiClient.post('/auth/verify-email', { otp });
          
          // Update store state
          const currentUser = get().user;
          if (currentUser) {
            set({
              user: { ...currentUser, isEmailVerified: true }
            });
          }
          set({ isLoading: false });
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          const errorMsg = error.response?.data?.error || 'Verification failed';
          throw new Error(errorMsg);
        }
      },

      resendEmailOtpAction: async () => {
        try {
          const response = await apiClient.post('/auth/request-email-otp');
          return response.data;
        } catch (error) {
          const errorMsg = error.response?.data?.error || 'Failed to resend email OTP';
          throw new Error(errorMsg);
        }
      },
      
      clearFirstLogin: () => set({ isFirstLogin: false }),

      updateProfileAction: async (name, email, phone, avatarUrl, clinicLat, clinicLng, upiId, upiQrCode, razorpayId, address, city, state) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.patch('/auth/profile', { name, email, phone, avatarUrl, clinicLat, clinicLng, upiId, upiQrCode, razorpayId, address, city, state });
          const { user } = response.data;
          set({ user, isLoading: false });
          return { success: true, user };
        } catch (error) {
          set({ isLoading: false });
          let errorMsg = 'Failed to update profile';
          if (error.response && error.response.data) {
             errorMsg = error.response.data.error || error.response.data.message || 'Failed to update profile';
          } else if (error.message) {
             errorMsg = error.message;
          }
          throw new Error(errorMsg);
        }
      },

      changePasswordAction: async (currentPassword, newPassword) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.post('/auth/change-password', { currentPassword, newPassword });
          set({ isLoading: false });
          return { success: true, message: response.data.message };
        } catch (error) {
          set({ isLoading: false });
          let errorMsg = 'Failed to change password';
          if (error.response && error.response.data) {
             errorMsg = error.response.data.error || error.response.data.message || 'Failed to change password';
          } else if (error.message) {
             errorMsg = error.message;
          }
          throw new Error(errorMsg);
        }
      },

      forgotPasswordAction: async (email) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.post('/auth/forgot-password', { email });
          set({ isLoading: false });
          return { success: true, message: response.data.message };
        } catch (error) {
          set({ isLoading: false });
          let errorMsg = 'Failed to request password reset';
          if (error.response && error.response.data) {
             errorMsg = error.response.data.error || error.response.data.message || 'Failed to request password reset';
          } else if (error.message) {
             errorMsg = error.message;
          }
          throw new Error(errorMsg);
        }
      },

      resetPasswordAction: async (email, otp, newPassword) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.post('/auth/reset-password', { email, otp, newPassword });
          set({ isLoading: false });
          return { success: true, message: response.data.message };
        } catch (error) {
          set({ isLoading: false });
          let errorMsg = 'Failed to reset password';
          if (error.response && error.response.data) {
             errorMsg = error.response.data.error || error.response.data.message || 'Failed to reset password';
          } else if (error.message) {
             errorMsg = error.message;
          }
          throw new Error(errorMsg);
        }
      },

      logout: () => {
        set({
          isLoggedIn: false,
          user: null,
          token: null,
          refreshToken: null,
          isFirstLogin: false
        });
        // Clear all cached store data on logout
        // Dynamic imports prevent circular dependency issues
        import('./postStore').then(({ usePostStore }) => {
          usePostStore.getState().clearCache();
        });
        import('./adoptionStore').then(({ useAdoptionStore }) => {
          useAdoptionStore.getState().clearCache();
        });
        import('./campaignStore').then(({ useCampaignStore }) => {
          useCampaignStore.getState().clearCache();
        });
        // Profile stores are user-scoped (key: straycare_profile_<userId>, straycare_vet_profile_<userId>)
        // so they are naturally isolated per user — no explicit clear needed
        import('./vetProfileStore').then(({ getVetProfileStore }) => {
          try {
            const raw = localStorage.getItem('straycare_user');
            if (raw) {
              const parsed = JSON.parse(raw);
              const userId = parsed?.state?.user?.id;
              if (userId) getVetProfileStore(userId).getState().clearCache();
            }
          } catch (_) {}
        });
      },
    }),
    {
      name: 'straycare_user', // unique name for localStorage key
      // Persist isLoggedIn, user, token, and refreshToken
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken
      }),
    }
  )
);

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
          // Fallback logic for mock credentials when backend is offline
          const isNetworkError = !error.response;
          if (isNetworkError && email === '12@g.com' && password === '1234') {
            const mockUser = {
              id: 'mock-rescuer-id',
              name: 'Test Rescuer',
              email: '12@g.com',
              phone: '1234567890',
              role: 'RESCUER',
              isEmailVerified: true,
              isPhoneVerified: true
            };
            set({
              isLoggedIn: true,
              user: mockUser,
              token: 'mock-access-token',
              refreshToken: 'mock-refresh-token',
              isFirstLogin: true,
              isLoading: false
            });
            return { success: true, user: mockUser };
          }
          
          set({ isLoading: false });
          const errorMsg = error.response?.data?.error || 'Authentication failed';
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
          const errorMsg = error.response?.data?.error || 'Registration failed';
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

      verifyPhoneAction: async (otp) => {
        set({ isLoading: true });
        try {
          await apiClient.post('/auth/verify-phone', { otp });
          
          // Update store state
          const currentUser = get().user;
          if (currentUser) {
            set({
              user: { ...currentUser, isPhoneVerified: true }
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

      resendPhoneOtpAction: async () => {
        try {
          const response = await apiClient.post('/auth/request-phone-otp');
          return response.data;
        } catch (error) {
          const errorMsg = error.response?.data?.error || 'Failed to resend phone OTP';
          throw new Error(errorMsg);
        }
      },
      
      clearFirstLogin: () => set({ isFirstLogin: false }),

      logout: () => {
        set({
          isLoggedIn: false,
          user: null,
          token: null,
          refreshToken: null,
          isFirstLogin: false
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

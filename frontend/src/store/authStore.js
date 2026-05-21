import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      isLoggedIn: false,
      user: null,
      isLoading: false,
      isFirstLogin: false, // New flag for splash loader
      
      login: (userData) => {
        // Ensure role exists for ProtectedRoute logic
        if (!userData.role) userData.role = 'USER';
        set({ isLoggedIn: true, user: userData, isFirstLogin: true });
      },
      
      clearFirstLogin: () => set({ isFirstLogin: false }),

      logout: () => {
        set({ isLoggedIn: false, user: null, isFirstLogin: false });
      },
    }),
    {
      name: 'straycare_user', // unique name for localStorage key
      // We only want to persist isLoggedIn and user
      partialize: (state) => ({ isLoggedIn: state.isLoggedIn, user: state.user }),
    }
  )
);

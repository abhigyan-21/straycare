import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      isLoggedIn: false,
      user: null,
      isLoading: false, // Sync hydration, so no loading state needed
      
      login: (userData) => {
        // Ensure role exists for ProtectedRoute logic
        if (!userData.role) userData.role = 'USER';
        set({ isLoggedIn: true, user: userData });
      },
      
      logout: () => {
        set({ isLoggedIn: false, user: null });
      },
    }),
    {
      name: 'straycare_user', // unique name for localStorage key
      // We only want to persist isLoggedIn and user, not isLoading if it were dynamically changing
      partialize: (state) => ({ isLoggedIn: state.isLoggedIn, user: state.user }),
    }
  )
);

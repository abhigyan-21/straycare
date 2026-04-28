import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useRescueStore = create(
  persist(
    (set) => ({
      activeRescue: {
        isActive: false,
        reportId: null,
        mode: null, // 'user' or 'rescuer'
        eta: null
      },

      startRescue: (reportId, mode, initialEta) => 
        set({
          activeRescue: {
            isActive: true,
            reportId,
            mode,
            eta: initialEta || 0
          }
        }),

      updateRescueEta: (newEta) =>
        set((state) => ({
          activeRescue: {
            ...state.activeRescue,
            eta: newEta
          }
        })),

      endRescue: () =>
        set({
          activeRescue: {
            isActive: false,
            reportId: null,
            mode: null,
            eta: null
          }
        }),
    }),
    {
      name: 'activeRescue', // unique name for localStorage key
    }
  )
);

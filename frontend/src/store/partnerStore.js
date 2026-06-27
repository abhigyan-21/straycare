import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';
import { isCacheValid } from '../utils/cacheUtils';

export const usePartnerStore = create(
    persist(
        (set, get) => ({
            partners: [],
            lastFetched: null,
            loading: false,

            fetchPartners: async (force = false) => {
                const { partners, lastFetched } = get();
                // 5 minutes TTL for partners to reflect newer ones quicker
                const cacheHit = !force && isCacheValid(lastFetched, 5 * 60 * 1000) && partners.length > 0;

                if (cacheHit) {
                    return;
                }

                if (partners.length === 0) {
                    set({ loading: true });
                }

                try {
                    const response = await api.get('/partners');
                    if (Array.isArray(response.data)) {
                        set({
                            partners: response.data,
                            lastFetched: Date.now(),
                            loading: false
                        });
                    } else {
                        set({ loading: false });
                    }
                } catch (error) {
                    console.error('Failed to fetch partners:', error);
                    set({ loading: false });
                }
            }
        }),
        {
            name: 'straycare_partners',
            partialize: (state) => ({
                partners: state.partners,
                lastFetched: state.lastFetched
            })
        }
    )
);

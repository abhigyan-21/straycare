import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getPets, getUserAdoptionRequests, submitAdoptionRequest, cancelAdoptionRequest } from '../services/api';
import { isCacheValid, TTL } from '../utils/cacheUtils';

export const useAdoptionStore = create(
    persist(
        (set, get) => ({
            pets: [],
            // interestedPets stored as array (Set can't be JSON-serialised by localStorage)
            interestedPets: [],
            lastFetched: null,
            loading: false,
            error: null,

            // Location preferences
            userLat: null,
            userLng: null,
            maxDistance: 50, // default to 50km

            setLocation: (lat, lng) => {
                set({ userLat: lat, userLng: lng });
                get().invalidateCache(); // Invalidate cache so it fetches again with new location
            },

            setMaxDistance: (distance) => {
                set({ maxDistance: distance });
                get().invalidateCache(); // Invalidate cache
            },

            // ── Fetch Pets + User Requests (with TTL + stale-while-revalidate) ─
            fetchPetsAndRequests: async (force = false) => {
                const { pets, lastFetched, userLat, userLng, maxDistance } = get();
                const cacheHit = !force && isCacheValid(lastFetched, TTL.adoptions);

                if (cacheHit) {
                    // Cache is fresh — serve immediately
                    return;
                }

                // Stale-while-revalidate: only show a hard loading state if we have NO data
                if (pets.length === 0) {
                    set({ loading: true, error: null });
                }

                try {
                    const [petsData, reqsData] = await Promise.all([
                        getPets(userLat, userLng, maxDistance),
                        getUserAdoptionRequests(),
                    ]);

                    const activePetIds = reqsData
                        .filter(r => r.status === 'PENDING' || r.status === 'INTERVIEW_SCHEDULED')
                        .map(r => r.petId);

                    set({
                        pets: petsData,
                        interestedPets: activePetIds,
                        lastFetched: Date.now(),
                        loading: false,
                        error: null,
                    });
                } catch (err) {
                    console.error('Failed to load adoption data:', err);
                    set({ error: err.message || 'Failed to load pets', loading: false });
                }
            },

            // ── Submit Interest (optimistic add) ─────────────────────────────
            submitInterest: async (pet) => {
                // Optimistic update
                set((state) => ({
                    interestedPets: [...state.interestedPets, pet.id],
                }));
                try {
                    await submitAdoptionRequest(pet.id);
                } catch (error) {
                    // Rollback on failure
                    set((state) => ({
                        interestedPets: state.interestedPets.filter(id => id !== pet.id),
                    }));
                    console.error('Failed to submit adoption request:', error);
                    throw error;
                }
            },

            // ── Cancel Interest (optimistic remove) ──────────────────────────
            cancelInterest: async (pet) => {
                // Optimistic update
                set((state) => ({
                    interestedPets: state.interestedPets.filter(id => id !== pet.id),
                }));
                try {
                    await cancelAdoptionRequest(pet.id);
                } catch (error) {
                    // Rollback on failure
                    set((state) => ({
                        interestedPets: [...state.interestedPets, pet.id],
                    }));
                    console.error('Failed to cancel adoption request:', error);
                    throw error;
                }
            },

            // ── Helpers ────────────────────────────────────────────────────────
            isInterested: (petId) => get().interestedPets.includes(petId),

            invalidateCache: () => set({ lastFetched: null }),

            clearCache: () => set({ pets: [], interestedPets: [], lastFetched: null }),
        }),
        {
            name: 'straycare_adoptions',
            partialize: (state) => ({
                pets: state.pets,
                interestedPets: state.interestedPets,
                lastFetched: state.lastFetched,
                userLat: state.userLat,
                userLng: state.userLng,
                maxDistance: state.maxDistance,
            }),
        }
    )
);

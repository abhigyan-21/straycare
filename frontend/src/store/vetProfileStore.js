import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getProfile, getUserDocuments, uploadUserDocument, deleteUserDocument } from '../services/api';
import { isCacheValid, TTL } from '../utils/cacheUtils';

// ── User-scoped storage key (prevents cross-user data leakage) ────────────────
const getScopedStorage = (userId) => ({
    name: `straycare_vet_profile_${userId || 'guest'}`,
    storage: createJSONStorage(() => localStorage),
});

// ── Store instance cache (one store per userId) ───────────────────────────────
const storeCache = {};

export const getVetProfileStore = (userId) => {
    const key = userId || 'guest';
    if (!storeCache[key]) {
        storeCache[key] = create(
            persist(
                (set, get) => ({
                    vetData: null,
                    documents: [],
                    lastFetchedProfile: null,
                    lastFetchedDocs: null,
                    loading: false,

                    // ── Fetch profile + documents (TTL + stale-while-revalidate) ──
                    fetchVetProfile: async (authUser) => {
                        const { vetData, documents, lastFetchedProfile } = get();
                        const profileCacheHit =
                            isCacheValid(lastFetchedProfile, TTL.profile) && vetData !== null;

                        if (profileCacheHit) return;

                        // Stale-while-revalidate: show cached data, refresh silently
                        const hasStaleData = vetData !== null && !isCacheValid(lastFetchedProfile, TTL.profile);
                        if (!hasStaleData) {
                            set({ loading: true });
                        }

                        try {
                            const [profileData, docsData] = await Promise.all([
                                getProfile(),
                                getUserDocuments(),
                            ]);

                            const mappedVetData = {
                                name: profileData.user.name,
                                email: profileData.user.email,
                                phone: profileData.user.contact || profileData.user.phone || 'N/A',
                                role: profileData.user.role,
                                avatar: profileData.user.avatarUrl ||
                                    'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=400&auto=format&fit=crop',
                                clinicName:
                                    profileData.user.partner?.name ||
                                    profileData.user.clinic?.name ||
                                    'StrayCare Partner',
                                licenseNo:
                                    profileData.registrationDetails?.registrationNumber || 'N/A',
                                joined: new Date(profileData.user.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                }),
                                location:
                                    profileData.user.partner?.address ||
                                    profileData.user.clinic?.address ||
                                    'N/A',
                                specialization: 'General Veterinary Care',
                                experience: 'N/A',
                                experienceFull: 'Board certified veterinary clinic staff.',
                                totalRescues: profileData.stats?.totalRescues || 0,
                                activeCampaigns: profileData.stats?.activeCampaigns || 0,
                                successfulAdoptions: profileData.stats?.successfulAdoptions || 0,
                                lat: profileData.user.partner?.lat || profileData.user.clinic?.lat || null,
                                lng: profileData.user.partner?.lng || profileData.user.clinic?.lng || null,
                                upiId: profileData.user.partner?.upiId || '',
                                upiQrCode: profileData.user.partner?.upiQrCode || '',
                                razorpayId: profileData.user.partner?.razorpayAccountId || '',
                            };

                            // Filter out REGISTRATION type docs (shown separately on main tab)
                            const filteredDocs = (docsData || []).filter(d => d.type !== 'REGISTRATION');

                            set({
                                vetData: mappedVetData,
                                documents: filteredDocs,
                                lastFetchedProfile: Date.now(),
                                lastFetchedDocs: Date.now(),
                                loading: false,
                            });
                        } catch (err) {
                            console.error('Failed to load vet profile:', err);
                            // Fallback to mock data if no cached data exists
                            if (!get().vetData) {
                                set({
                                    vetData: {
                                        name: authUser?.name || 'Dr. Arjun Mehta',
                                        email: authUser?.email || 'contact@healthypaws.com',
                                        phone: '+91 98765 43210',
                                        role: authUser?.role || 'clinic',
                                        avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=400&auto=format&fit=crop',
                                        clinicName: 'Healthy Paws Veterinary Clinic',
                                        licenseNo: 'VET-MH-2026-8842',
                                        joined: 'October 2025',
                                        location: 'Sector 45, Gurgaon, Haryana - 122003',
                                        specialization: 'Small Animal Surgery, Preventive Medicine',
                                        experience: '12 Years',
                                        experienceFull: 'Over a decade of experience in domestic animal care.',
                                        totalRescues: 142,
                                        activeCampaigns: 2,
                                        successfulAdoptions: 89,
                                        lat: 30.7333,
                                        lng: 76.7794,
                                        upiId: '',
                                        upiQrCode: '',
                                        razorpayId: '',
                                    },
                                    documents: [],
                                });
                            }
                            set({ loading: false });
                        }
                    },

                    // ── Optimistic profile field update ───────────────────────
                    updateVetData: (partial) => {
                        set((state) => ({
                            vetData: state.vetData ? { ...state.vetData, ...partial } : state.vetData,
                        }));
                    },

                    // ── Document mutations ─────────────────────────────────────
                    addDocument: (doc) => {
                        set((state) => ({ documents: [doc, ...state.documents] }));
                    },

                    removeDocument: async (id) => {
                        // Optimistic removal
                        set((state) => ({
                            documents: state.documents.filter(d => d.id !== id),
                        }));
                        try {
                            await deleteUserDocument(id);
                        } catch (err) {
                            console.error('Failed to delete document on backend:', err);
                            throw err; // re-throw so caller can show alert
                        }
                    },

                    // ── Helpers ───────────────────────────────────────────────
                    invalidateCache: () => set({ lastFetchedProfile: null, lastFetchedDocs: null }),

                    clearCache: () =>
                        set({
                            vetData: null,
                            documents: [],
                            lastFetchedProfile: null,
                            lastFetchedDocs: null,
                        }),
                }),
                getScopedStorage(userId)
            )
        );
    }
    return storeCache[key];
};

// ── Convenience hook — reads userId from localStorage (avoids circular dep) ───
export const useVetProfileStore = () => {
    let userId = null;
    try {
        const raw = localStorage.getItem('straycare_user');
        if (raw) {
            const parsed = JSON.parse(raw);
            userId = parsed?.state?.user?.id || null;
        }
    } catch (_) {}
    return getVetProfileStore(userId)();
};

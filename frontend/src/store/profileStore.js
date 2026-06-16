import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import apiClient from '../services/api';
import { isCacheValid, TTL } from '../utils/cacheUtils';
import { usePostStore } from './postStore';

// ── User-scoped localStorage key ─────────────────────────────────────────────
// Prevents data leaking between different users on the same device.
const getUserScopedStorage = (userId) => ({
    name: `straycare_profile_${userId || 'guest'}`,
    storage: createJSONStorage(() => localStorage),
});

// Factory — call this to get a user-specific store instance
// Usage: getProfileStore(userId)  →  returns the Zustand store hook
const storeCache = {};

export const getProfileStore = (userId) => {
    const key = userId || 'guest';
    if (!storeCache[key]) {
        storeCache[key] = create(
            persist(
                (set, get) => ({
                    posts: [],
                    reports: [],
                    donations: [],
                    subscriptions: [],
                    documents: [],
                    adoptions: [],
                    rescues: [],
                    lastFetched: null,
                    loading: false,

                    // ── Fetch all profile data (TTL + stale-while-revalidate) ──
                    fetchProfileData: async (authUser) => {
                        const { lastFetched } = get();
                        const cacheHit = isCacheValid(lastFetched, TTL.profile);

                        if (cacheHit) return;

                        const hasStaleData = lastFetched !== null && !isCacheValid(lastFetched, TTL.profile);
                        if (!hasStaleData) {
                            set({ loading: true });
                        }

                        try {
                            const promises = [
                                apiClient.get('/feed/my-posts').catch(() => ({ data: null })),
                                apiClient.get('/reports/my-reports').catch(() => ({ data: null })),
                                apiClient.get('/funding/my-donations').catch(() => ({ data: null })),
                                apiClient.get('/medical/documents').catch(() => ({ data: null })),
                                apiClient.get('/adoptions/requests').catch(() => ({ data: null })),
                            ];

                            if (authUser?.role === 'RESCUER') {
                                promises.push(apiClient.get('/reports/my-rescues').catch(() => ({ data: null })));
                            }

                            const results = await Promise.all(promises);
                            const [postsRes, reportsRes, donationsRes, docsRes, adoptionsRes, rescuesRes] = results;

                            const posts = postsRes?.data
                                ? postsRes.data.map(p => ({
                                    id: p.id,
                                    image: p.postImage || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600',
                                    caption: p.caption,
                                    likes: p._count?.likes || 0,
                                    createdAt: p.createdAt,
                                }))
                                : [];

                            const reports = reportsRes?.data
                                ? reportsRes.data.map(r => ({
                                    id: r.id.substring(0, 8),
                                    actualId: r.id,
                                    image: r.mediaUrls[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                                    name: r.description.length > 25 ? r.description.substring(0, 25) + '...' : r.description,
                                    location: `Lat: ${r.locationLat.toFixed(2)}, Lng: ${r.locationLng.toFixed(2)}`,
                                    date: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                                }))
                                : [];

                            let donations = [];
                            let subscriptions = [];
                            if (donationsRes?.data?.status === 'success') {
                                donations = donationsRes.data.donations.map(d => ({
                                    id: d.id,
                                    amount: `₹${d.amount}`,
                                    date: new Date(d.createdAt).toISOString().split('T')[0],
                                    type: d.type === 'CAMPAIGN' ? 'Campaign Donation' : `${d.type} Donation`,
                                    to: d.campaign?.title || d.partner?.name || d.clinic?.name || 'StrayCare General Fund',
                                }));
                                subscriptions = donationsRes.data.subscriptions.map(s => ({
                                    id: s.id,
                                    amount: `₹${s.amount}`,
                                    date: new Date(s.createdAt).toISOString().split('T')[0],
                                    type: 'Monthly Autopay',
                                    to: s.partner?.name || s.clinic?.name || 'Clinic Partner',
                                    status: s.status,
                                }));
                            }

                            const documents = docsRes?.data
                                ? docsRes.data.map(d => ({
                                    id: d.id,
                                    name: d.name,
                                    dateAdded: new Date(d.createdAt).toISOString().split('T')[0],
                                    type: d.type,
                                    fileData: d.fileData,
                                }))
                                : [];

                            let adoptions = [];
                            if (adoptionsRes?.data?.status === 'success') {
                                adoptions = adoptionsRes.data.data.map(a => {
                                    let statusText = 'Pending Review';
                                    let statusType = 'pending';
                                    if (a.status === 'INTERVIEW_SCHEDULED') { statusText = 'Interview Scheduled'; statusType = 'interview'; }
                                    else if (a.status === 'APPROVED') { statusText = 'Successfully Adopted'; statusType = 'adopted'; }
                                    else if (a.status === 'REJECTED') { statusText = 'Rejected'; statusType = 'rejected'; }
                                    return {
                                        id: a.id,
                                        petName: a.pet.name || 'Stray Pet',
                                        petBreed: a.pet.breed || 'Mixed',
                                        petImage: a.pet.report?.mediaUrls?.[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=500',
                                        status: statusText,
                                        statusType,
                                        date: new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                                        clinic: a.pet.partner?.name || a.pet.clinic?.name || 'StrayCare Center',
                                    };
                                });
                            }

                            const rescues = (authUser?.role === 'RESCUER' && rescuesRes?.data)
                                ? rescuesRes.data.map(r => ({
                                    id: r.id,
                                    image: r.mediaUrls?.[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                                    description: r.description,
                                    status: r.status,
                                    reporterName: r.reporter?.name || 'Anonymous',
                                    reporterPhone: r.reporter?.phone || 'N/A',
                                    date: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                                    lat: r.locationLat,
                                    lng: r.locationLng,
                                }))
                                : [];

                            set({
                                posts,
                                reports,
                                donations,
                                subscriptions,
                                documents,
                                adoptions,
                                rescues,
                                lastFetched: Date.now(),
                                loading: false,
                            });
                        } catch (error) {
                            console.error('Error fetching profile data:', error);
                            set({ loading: false });
                        }
                    },

                    // ── Post mutations ────────────────────────────────────────
                    addPost: (post) => {
                        set((state) => ({ posts: [post, ...state.posts] }));
                        // Invalidate the feed cache so it reflects the new post
                        usePostStore.getState().invalidateCache();
                    },

                    editPost: (id, caption) => {
                        set((state) => ({
                            posts: state.posts.map(p => p.id === id ? { ...p, caption } : p),
                        }));
                        // Also update the feed store optimistically
                        usePostStore.setState((state) => ({
                            posts: state.posts.map(p => p.id === id ? { ...p, caption } : p),
                        }));
                    },

                    deletePost: async (id) => {
                        // Optimistic removal
                        set((state) => ({ posts: state.posts.filter(p => p.id !== id) }));
                        usePostStore.getState().removePost(id);
                        try {
                            await apiClient.delete(`/feed/${id}`);
                        } catch (err) {
                            console.warn('Backend failed to delete post, local removal retained.', err);
                        }
                    },

                    // ── Document mutations ────────────────────────────────────
                    addDocument: (doc) => {
                        set((state) => ({ documents: [doc, ...state.documents] }));
                    },

                    deleteDocument: async (id) => {
                        set((state) => ({ documents: state.documents.filter(d => d.id !== id) }));
                        try {
                            await apiClient.delete(`/medical/documents/${id}`);
                        } catch (err) {
                            console.warn('Backend failed to delete document, local removal retained.', err);
                        }
                    },

                    // ── Subscription mutation ─────────────────────────────────
                    cancelSubscription: async (id) => {
                        set((state) => ({
                            subscriptions: state.subscriptions.map(s =>
                                s.id === id ? { ...s, status: 'CANCELLED' } : s
                            ),
                        }));
                        try {
                            await apiClient.post(`/funding/subscriptions/${id}/cancel`);
                        } catch (err) {
                            console.warn('Backend failed to cancel subscription, local update retained.', err);
                        }
                    },

                    // ── Helpers ───────────────────────────────────────────────
                    invalidateCache: () => set({ lastFetched: null }),

                    clearCache: () =>
                        set({
                            posts: [], reports: [], donations: [], subscriptions: [],
                            documents: [], adoptions: [], rescues: [], lastFetched: null,
                        }),
                }),
                getUserScopedStorage(userId)
            )
        );
    }
    return storeCache[key];
};

// ── Convenience hook (reads userId from authStore at call time) ───────────────
// Usage in components: const store = useProfileStore();
export const useProfileStore = () => {
    // Lazy import avoids circular dependency with authStore
    let userId = null;
    try {
        const raw = localStorage.getItem('straycare_user');
        if (raw) {
            const parsed = JSON.parse(raw);
            userId = parsed?.state?.user?.id || null;
        }
    } catch (_) {}
    return getProfileStore(userId)();
};

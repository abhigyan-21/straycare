import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../services/api';
import { isCacheValid, TTL } from '../utils/cacheUtils';

export const useCampaignStore = create(
    persist(
        (set, get) => ({
            campaigns: [],
            highlights: {
                featuredCampaign: null,
                badgeText: 'LATEST CAMPAIGN',
                topContributor: null,
            },
            lastFetchedCampaigns: null,
            lastFetchedHighlights: null,
            loadingCampaigns: false,
            loadingHighlights: false,

            // ── Fetch Campaigns (TTL + stale-while-revalidate) ────────────────
            fetchCampaigns: async () => {
                const { campaigns, lastFetchedCampaigns } = get();
                const cacheHit = isCacheValid(lastFetchedCampaigns, TTL.campaigns) && campaigns.length > 0;

                if (cacheHit) return;

                const hasStaleData = campaigns.length > 0 && !isCacheValid(lastFetchedCampaigns, TTL.campaigns);
                if (!hasStaleData) {
                    set({ loadingCampaigns: true });
                }

                try {
                    const response = await apiClient.get('/funding/campaigns');
                    const data =
                        response.data?.status === 'success' && response.data?.data?.length > 0
                            ? response.data.data
                            : [];
                    set({ campaigns: data, lastFetchedCampaigns: Date.now(), loadingCampaigns: false });
                } catch (err) {
                    console.warn('Failed to fetch campaigns:', err.message);
                    set({ loadingCampaigns: false });
                }
            },

            // ── Fetch Highlights (TTL + stale-while-revalidate) ───────────────
            fetchHighlights: async () => {
                const { highlights, lastFetchedHighlights } = get();
                const cacheHit =
                    isCacheValid(lastFetchedHighlights, TTL.campaigns) &&
                    (highlights.featuredCampaign || highlights.topContributor);

                if (cacheHit) return;

                const hasStaleData =
                    (highlights.featuredCampaign || highlights.topContributor) &&
                    !isCacheValid(lastFetchedHighlights, TTL.campaigns);
                if (!hasStaleData) {
                    set({ loadingHighlights: true });
                }

                try {
                    const response = await apiClient.get('/funding/campaigns/highlights');
                    if (response.data?.status === 'success') {
                        set({
                            highlights: response.data.data,
                            lastFetchedHighlights: Date.now(),
                            loadingHighlights: false,
                        });
                    } else {
                        set({ loadingHighlights: false });
                    }
                } catch (err) {
                    console.warn('Failed to fetch highlights:', err.message);
                    set({ loadingHighlights: false });
                }
            },

            // ── Handle Donation (optimistic update + cache invalidation) ──────
            handleDonation: async (campaignId, amount) => {
                // Optimistic update: increment raisedAmount immediately
                set((state) => ({
                    campaigns: state.campaigns.map(c =>
                        c.id === campaignId
                            ? { ...c, raisedAmount: (c.raisedAmount || 0) + Number(amount) }
                            : c
                    ),
                    highlights: (() => {
                        const h = state.highlights;
                        if (h.featuredCampaign?.id === campaignId) {
                            return {
                                ...h,
                                featuredCampaign: {
                                    ...h.featuredCampaign,
                                    raisedAmount: (h.featuredCampaign.raisedAmount || 0) + Number(amount),
                                },
                            };
                        }
                        return h;
                    })(),
                }));

                try {
                    await apiClient.post(`/funding/campaigns/${campaignId}/donate-mock`, { amount });
                    // Invalidate cache so next visit fetches accurate server data
                    set({ lastFetchedCampaigns: null, lastFetchedHighlights: null });
                    return true;
                } catch (err) {
                    // Donation failed — optimistic update stays visible as a simulation
                    console.warn('Donation API failed, keeping optimistic update:', err.message);
                    return true;
                }
            },

            // ── Helpers ────────────────────────────────────────────────────────
            invalidateCache: () => set({ lastFetchedCampaigns: null, lastFetchedHighlights: null }),

            clearCache: () =>
                set({
                    campaigns: [],
                    highlights: { featuredCampaign: null, badgeText: 'LATEST CAMPAIGN', topContributor: null },
                    lastFetchedCampaigns: null,
                    lastFetchedHighlights: null,
                }),
        }),
        {
            name: 'straycare_campaigns',
            partialize: (state) => ({
                campaigns: state.campaigns,
                highlights: state.highlights,
                lastFetchedCampaigns: state.lastFetchedCampaigns,
                lastFetchedHighlights: state.lastFetchedHighlights,
            }),
        }
    )
);

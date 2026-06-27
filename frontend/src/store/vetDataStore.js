import { create } from 'zustand';
import apiClient, { unwrapApiData } from '../services/api';
import { isCacheValid, TTL } from '../utils/cacheUtils';

// We can reuse TTL.adoptions for reports and rescuers, or just define a local TTL
const VET_DATA_TTL = 5 * 60 * 1000; // 5 minutes

export const useVetDataStore = create((set, get) => ({
    // State
    reports: [],
    lastFetchedReports: null,

    pets: [],
    lastFetchedPets: null,

    requests: [],
    lastFetchedRequests: null,

    campaigns: [],
    lastFetchedCampaigns: null,

    rescuers: [],
    lastFetchedRescuers: null,

    // Fetch Actions
    fetchReports: async (force = false) => {
        const { reports, lastFetchedReports } = get();
        if (!force && isCacheValid(lastFetchedReports, VET_DATA_TTL) && reports.length > 0) {
            return reports;
        }
        try {
            const res = await apiClient.get('/reports/clinic');
            const data = unwrapApiData(res.data);
            set({ reports: data, lastFetchedReports: Date.now() });
            return data;
        } catch (error) {
            console.error('Failed to fetch clinic reports:', error);
            if (!force && reports.length > 0) return reports; // Fallback to stale
            return [];
        }
    },

    fetchPets: async (force = false) => {
        const { pets, lastFetchedPets } = get();
        if (!force && isCacheValid(lastFetchedPets, VET_DATA_TTL) && pets.length > 0) {
            return pets;
        }
        try {
            const res = await apiClient.get('/adoptions/pets');
            const data = unwrapApiData(res.data);
            set({ pets: data, lastFetchedPets: Date.now() });
            return data;
        } catch (error) {
            console.error('Failed to fetch clinic pets:', error);
            if (!force && pets.length > 0) return pets; // Fallback
            return [];
        }
    },

    fetchRequests: async (force = false) => {
        const { requests, lastFetchedRequests } = get();
        if (!force && isCacheValid(lastFetchedRequests, VET_DATA_TTL) && requests.length > 0) {
            return requests;
        }
        try {
            const res = await apiClient.get('/adoptions/requests');
            const data = unwrapApiData(res.data);
            set({ requests: data, lastFetchedRequests: Date.now() });
            return data;
        } catch (error) {
            console.error('Failed to fetch adoption requests:', error);
            if (!force && requests.length > 0) return requests; // Fallback
            return [];
        }
    },

    fetchCampaigns: async (force = false) => {
        const { campaigns, lastFetchedCampaigns } = get();
        if (!force && isCacheValid(lastFetchedCampaigns, VET_DATA_TTL) && campaigns.length > 0) {
            return campaigns;
        }
        try {
            const res = await apiClient.get('/funding/campaigns');
            const data = unwrapApiData(res.data);
            set({ campaigns: data, lastFetchedCampaigns: Date.now() });
            return data;
        } catch (error) {
            console.error('Failed to fetch clinic campaigns:', error);
            if (!force && campaigns.length > 0) return campaigns; // Fallback
            return [];
        }
    },

    fetchRescuers: async (force = false) => {
        const { rescuers, lastFetchedRescuers } = get();
        if (!force && isCacheValid(lastFetchedRescuers, VET_DATA_TTL) && rescuers.length > 0) {
            return rescuers;
        }
        try {
            const res = await apiClient.get('/users/rescuers');
            const data = unwrapApiData(res.data);
            set({ rescuers: data, lastFetchedRescuers: Date.now() });
            return data;
        } catch (error) {
            console.error('Failed to fetch clinic rescuers:', error);
            if (!force && rescuers.length > 0) return rescuers; // Fallback
            return [];
        }
    },

    // Invalidation (to force re-fetch on next access or immediately if called with fetch)
    invalidateReports: () => set({ lastFetchedReports: null }),
    invalidatePets: () => set({ lastFetchedPets: null }),
    invalidateRequests: () => set({ lastFetchedRequests: null }),
    invalidateCampaigns: () => set({ lastFetchedCampaigns: null }),
    invalidateRescuers: () => set({ lastFetchedRescuers: null }),

    clearCache: () => set({
        reports: [], lastFetchedReports: null,
        pets: [], lastFetchedPets: null,
        requests: [], lastFetchedRequests: null,
        campaigns: [], lastFetchedCampaigns: null,
        rescuers: [], lastFetchedRescuers: null,
    }),
}));

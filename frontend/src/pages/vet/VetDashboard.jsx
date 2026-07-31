import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import Loader from '../../components/Loader';
import '../../styles/vet/VetDashboard.css';
import LiveStatusView from '../../components/vet/LiveStatusView';
import ActionLoader from '../../components/ActionLoader';
import VetStatCard from '../../components/vet/VetStatCard';
import { useAuthStore } from '../../store/authStore';
import { getCampaignEndDate } from '../../services/api';
import { useVetDataStore } from '../../store/vetDataStore';
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
const POLL_INTERVAL_MS = 15000;

function VetDashboard() {
    const [rescues, setRescues] = useState([]);
    const [stats, setStats] = useState({
        liveAdoptions: 0,
        newRequests: 0,
        liveRequests: 0,
        latestCampaign: { title: 'No active campaign', date: '--' }
    });
    const { isFirstLogin, clearFirstLogin } = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);
    
    const { fetchReports, fetchPets, fetchRequests, fetchCampaigns, invalidateReports } = useVetDataStore();
    const socketRef = useRef();
    const pollTimerRef = useRef();

    const fetchData = useCallback(async (showLoader = false) => {
        if (showLoader) setIsLoading(true);
        const startTime = Date.now();
        try {
            const [reports, pets, reqs, camps] = await Promise.all([
                fetchReports(true), // always force-fresh for live status
                fetchPets(),
                fetchRequests(),
                fetchCampaigns()
            ]);

            const latestCamp = camps?.[0];

            const liveRescues = reports.filter(r => r.status === 'REPORTED' || r.status === 'ASSIGNED' || r.status === 'RESCUED');
            setRescues(liveRescues.map(r => ({
                id: r.id,
                displayId: r.id.substring(0, 8).toUpperCase(),
                description: r.description,
                status: r.rescuePhase === 'HEADING_TO_ANIMAL' ? 'on the way to pickup'
                      : r.rescuePhase === 'HEADING_TO_CLINIC'  ? 'on the way to clinic'
                      : r.status === 'RESCUED'                 ? 'on the way to clinic'
                      : r.status.toLowerCase().replace('_', ' '),
                image: r.mediaUrls?.[0] || null
            })));

            setStats({
                liveAdoptions: pets?.filter(p => p.status === 'AVAILABLE').length || 0,
                newRequests: reqs?.filter(r => r.status === 'PENDING').length || 0,
                liveRequests: reqs?.filter(r => r.status === 'INTERVIEW_SCHEDULED').length || 0,
                latestCampaign: latestCamp ? {
                    title: latestCamp.title,
                    date: getCampaignEndDate(latestCamp)
                        ? new Date(getCampaignEndDate(latestCamp)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                        : '--'
                } : { title: 'No active campaign', date: '--' }
            });
        } catch (error) {
            console.warn("Using mock data fallback for VetDashboard:", error);
            setRescues([]);
            setStats({
                liveAdoptions: 0,
                newRequests: 0,
                liveRequests: 0,
                latestCampaign: { title: 'No active campaign', date: '--' }
            });
        } finally {
            if (showLoader) {
                const elapsedTime = Date.now() - startTime;
                const minimumLoadingTime = isFirstLogin ? 2000 : 800;
                const remainingTime = Math.max(0, minimumLoadingTime - elapsedTime);
                setTimeout(() => {
                    setIsLoading(false);
                    if (isFirstLogin) clearFirstLogin();
                }, remainingTime);
            }
        }
    }, [fetchReports, fetchPets, fetchRequests, fetchCampaigns, isFirstLogin, clearFirstLogin]);

    // Initial load
    useEffect(() => {
        fetchData(true);
    }, [fetchData]);

    // Socket: instant updates when a report changes
    useEffect(() => {
        socketRef.current = io(SOCKET_URL, {
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 10000,
        });

        socketRef.current.on('report-updated', () => {
            invalidateReports();
            fetchData(false);
        });

        socketRef.current.on('new-report', () => {
            invalidateReports();
            fetchData(false);
        });

        return () => socketRef.current?.disconnect();
    }, [fetchData, invalidateReports]);

    // Polling fallback every 15s
    useEffect(() => {
        pollTimerRef.current = setInterval(() => fetchData(false), POLL_INTERVAL_MS);
        return () => clearInterval(pollTimerRef.current);
    }, [fetchData]);

    if (isLoading && isFirstLogin) return <Loader />;
    if (isLoading) return <ActionLoader message="Updating Dashboard..." />;

    return (
        <>
            <Helmet>
                <title>Furzo Vet Portal - Dashboard</title>
                <meta name="description" content="Overview of rescue operations, adoption stats, and campaign activity for your clinic on the Furzo Vet Portal." />
            </Helmet>
            <div className="vet-dashboard">
                <LiveStatusView rescues={rescues} />

                <div className="stats-grid">
                    <VetStatCard label="Live adoptions" value={stats.liveAdoptions} />
                    <VetStatCard label="New Requests" value={stats.newRequests} />
                    <VetStatCard label="Live Requests" value={stats.liveRequests} />
                    <VetStatCard
                        label="Campaign"
                        date={stats.latestCampaign.date}
                        campaignTitle={stats.latestCampaign.title}
                    />
                </div>
            </div>
        </>
    );
}

export default VetDashboard;


import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Loader from '../../components/Loader';
import '../../styles/vet/VetDashboard.css';
import LiveStatusView from '../../components/vet/LiveStatusView';
import ActionLoader from '../../components/ActionLoader';
import VetStatCard from '../../components/vet/VetStatCard';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../services/api';

import { MOCK_DASHBOARD_DATA } from '../../data/mock_vet_data';

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

    const fetchData = async () => {
        setIsLoading(true);
        const startTime = Date.now();
        try {
            const [reportsRes, petsRes, reqsRes, campsRes] = await Promise.all([
                apiClient.get('/reports/clinic'),
                apiClient.get('/adoptions/pets'),
                apiClient.get('/adoptions/requests'),
                apiClient.get('/funding/campaigns')
            ]);

            const reports = reportsRes.data;
            const pets = petsRes.data;
            const reqs = reqsRes.data;
            const camps = campsRes.data;

            const latestCamp = camps.data?.[0];

            const liveRescues = reports.filter(r => r.status === 'REPORTED' || r.status === 'ASSIGNED');
            setRescues(liveRescues.map(r => ({
                id: r.id.substring(0, 8).toUpperCase(),
                description: r.description,
                status: r.status.toLowerCase().replace('_', ' '),
                image: r.mediaUrls?.[0] || null
            })));

            setStats({
                liveAdoptions: pets.data?.filter(p => p.status === 'AVAILABLE').length || 0,
                newRequests: reqs.data?.filter(r => r.status === 'PENDING').length || 0,
                liveRequests: reqs.data?.filter(r => r.status === 'INTERVIEW_SCHEDULED').length || 0,
                latestCampaign: latestCamp ? {
                    title: latestCamp.title,
                    date: new Date(latestCamp.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                } : { title: 'No active campaign', date: '--' }
            });
        } catch (error) {
            console.warn("Using mock data fallback for VetDashboard:", error);
            setRescues(MOCK_DASHBOARD_DATA.rescues);
            setStats(MOCK_DASHBOARD_DATA.stats);
        } finally {
            const elapsedTime = Date.now() - startTime;
            const minimumLoadingTime = isFirstLogin ? 2000 : 800; // 2 seconds for splash, 800ms for regular loader
            const remainingTime = Math.max(0, minimumLoadingTime - elapsedTime);

            setTimeout(() => {
                setIsLoading(false);
                if (isFirstLogin) {
                    clearFirstLogin();
                }
            }, remainingTime);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

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


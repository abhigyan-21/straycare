import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Loader from '../../components/Loader';
import '../../styles/vet/VetDashboard.css';
import LiveStatusView from '../../components/vet/LiveStatusView';
import ActionLoader from '../../components/ActionLoader';
import VetStatCard from '../../components/vet/VetStatCard';
import { useAuthStore } from '../../store/authStore';
import { getCampaignEndDate } from '../../services/api';
import { useVetDataStore } from '../../store/vetDataStore';

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
    
    const { fetchReports, fetchPets, fetchRequests, fetchCampaigns } = useVetDataStore();

    const fetchData = async () => {
        setIsLoading(true);
        const startTime = Date.now();
        try {
            const [reports, pets, reqs, camps] = await Promise.all([
                fetchReports(),
                fetchPets(),
                fetchRequests(),
                fetchCampaigns()
            ]);

            const latestCamp = camps?.[0];

            const liveRescues = reports.filter(r => r.status === 'REPORTED' || r.status === 'ASSIGNED');
            setRescues(liveRescues.map(r => ({
                id: r.id.substring(0, 8).toUpperCase(),
                description: r.description,
                status: r.status.toLowerCase().replace('_', ' '),
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
            const elapsedTime = Date.now() - startTime;
            const minimumLoadingTime = isFirstLogin ? 2000 : 800;
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


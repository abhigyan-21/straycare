import React from 'react';
import '../../styles/vet/VetDashboard.css';
import LiveStatusView from '../../components/vet/LiveStatusView';
import VetStatCard from '../../components/vet/VetStatCard';

const MOCK_DATA = {
    rescues: [
        { id: 'REP-7729', description: 'Golden Retriever found near Central Park with a leg injury.', status: 'in transit', image: null },
        { id: 'REP-8102', description: 'Stray cat trapped in a drain near sector 5.', status: 'reached clinic', image: null },
        { id: 'REP-9003', description: 'Wounded beagle reported near the bypass.', status: 'pickup', image: null },
        { id: 'REP-1104', description: 'Sick puppy found in a box near the market.', status: 'in transit', image: null },
        { id: 'REP-2205', description: 'Injured bird rescued from a rooftop.', status: 'pickup', image: null }
    ],
    stats: {
        liveAdoptions: 5,
        newRequests: 3,
        liveRequests: 3,
        latestCampaign: {
            title: 'Winter Shelter Drive',
            date: '25th Dec'
        }
    }
};

function VetDashboard() {
    const { rescues, stats } = MOCK_DATA;

    return (
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
    );
}

export default VetDashboard;


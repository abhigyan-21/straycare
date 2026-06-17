import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import apiClient from '../../services/api';
import Loader from '../../components/Loader';
import '../../styles/user/PublicPartner.css';

const PublicPartner = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('active');

    useEffect(() => {
        const fetchPartner = async () => {
            try {
                const response = await apiClient.get(`/partners/${id}/public`);
                setData(response.data);
            } catch (err) {
                console.error("Error fetching partner:", err);
                setError("Failed to load partner profile. They might not exist.");
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchPartner();
    }, [id]);

    if (loading) return <Loader />;
    if (error) return <div style={{ textAlign: 'center', padding: '100px 20px', color: '#e53e3e', fontSize: '1.2rem' }}>{error}</div>;
    if (!data || !data.partner) return <div style={{ textAlign: 'center', padding: '100px 20px' }}>Partner not found.</div>;

    const { partner, stats, campaigns } = data;
    const displayCampaigns = activeTab === 'active' ? campaigns.active : campaigns.completed;

    return (
        <>
            <Helmet>
                <title>{partner.name} - Furzo Partner</title>
                <meta name="description" content={`View the public profile and campaigns of ${partner.name} on Furzo.`} />
            </Helmet>

            <div className="public-partner-page">
                {/* Header Section */}
                <div className="public-partner-header">
                    <h1>
                        {partner.name}
                        {partner.verificationStatus === 'VERIFIED' && (
                            <span className="verification-badge" title="Verified Partner">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                                Verified
                            </span>
                        )}
                    </h1>
                    <div className="partner-subtitle">
                        {partner.partnerType} Organization
                    </div>
                    {(partner.city || partner.state) && (
                        <div className="partner-location">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            {partner.city}{partner.city && partner.state ? ', ' : ''}{partner.state}
                        </div>
                    )}
                </div>

                {/* Statistics Cards */}
                <div className="public-partner-stats">
                    <div className="stat-card">
                        <div className="stat-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                        </div>
                        <div className="stat-value">{stats.totalCreated}</div>
                        <div className="stat-label">Requests Created</div>
                    </div>

                    <div className="stat-card completed">
                        <div className="stat-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                        </div>
                        <div className="stat-value">{stats.totalCompleted}</div>
                        <div className="stat-label">Requests Completed</div>
                    </div>

                    <div className="stat-card funds">
                        <div className="stat-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="1" x2="12" y2="23"></line>
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                        </div>
                        <div className="stat-value">₹{stats.fundsRaised.toLocaleString()}</div>
                        <div className="stat-label">Funds Raised</div>
                    </div>
                </div>

                {/* Campaigns & Support Requests */}
                <div className="campaigns-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                        onClick={() => setActiveTab('active')}
                    >
                        Active ({campaigns.active.length})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
                        onClick={() => setActiveTab('completed')}
                    >
                        Completed ({campaigns.completed.length})
                    </button>
                </div>

                {displayCampaigns.length === 0 ? (
                    <div className="no-campaigns">
                        No {activeTab} campaigns or support requests found for this partner.
                    </div>
                ) : (
                    <div className="campaigns-grid">
                        {displayCampaigns.map(campaign => {
                            const raised = parseFloat(campaign.raisedAmount || 0);
                            const goal = parseFloat(campaign.goalAmount || 1);
                            const percent = Math.min((raised / goal) * 100, 100);

                            return (
                                <Link to={`/funding/${campaign.id}`} key={campaign.id} className="campaign-card">
                                    <img
                                        src={campaign.banner || campaign.image || 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=800'}
                                        alt={campaign.title}
                                        className="campaign-card-img"
                                    />
                                    <div className="campaign-card-body">
                                        <span className="campaign-type">{campaign.requestType}</span>
                                        <h3 className="campaign-title">{campaign.title}</h3>
                                        <p className="campaign-desc">{campaign.description}</p>

                                        <div className="campaign-progress-bar">
                                            <div className="campaign-progress-fill" style={{ width: `${percent}%` }}></div>
                                        </div>
                                        <div className="campaign-stats">
                                            <span className="raised">₹{raised.toLocaleString()} raised</span>
                                            <span className="goal">of ₹{goal.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
};

export default PublicPartner;

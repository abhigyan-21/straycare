import React, { useState, useEffect } from 'react';
import '../../styles/vet/VetDashboard.css';
import '../../styles/vet/VetCampaign.css';
import '../../styles/vet/VetAdopt.css';
import { Plus, Type, FileText, Target, Calendar, MapPin, Info } from 'lucide-react';
import CampaignHeroCard from '../../components/vet/CampaignHeroCard';
import CampaignListItem from '../../components/vet/CampaignListItem';
import VetTabs from '../../components/vet/VetTabs';
import CampaignDetailModal from '../../components/vet/CampaignDetailModal';
import ActionLoader from '../../components/ActionLoader';
import apiClient from '../../services/api';

import { MOCK_CAMPAIGNS } from '../../data/mock_vet_data';

function VetCampaign() {
    const [activeTab, setActiveTab] = useState('manage');
    const [campaigns, setCampaigns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [filter, setFilter] = useState('all');
    const [newCampaign, setNewCampaign] = useState({
        title: '',
        description: '',
        goalAmount: '',
        startDate: '',
        endDate: '',
        location: '',
        purpose: ''
    });

    const fetchCampaigns = async () => {
        setIsLoading(true);
        const startTime = Date.now();
        try {
            const response = await apiClient.get('/funding/campaigns');
            setCampaigns(response.data.data || []);
        } catch (error) {
            console.warn("Using mock campaigns fallback:", error);
            setCampaigns(MOCK_CAMPAIGNS);
        } finally {
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, 800 - elapsedTime);
            setTimeout(() => {
                setIsLoading(false);
            }, remainingTime);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const activeCampaigns = campaigns.filter(c => c.status === 'active' || c.status === 'APPROVED');

    const filteredCampaigns = campaigns.filter(c => {
        if (filter === 'all') return true;
        const today = new Date();
        const start = new Date(c.startDate);
        const end = new Date(c.endDate);
        
        if (filter === 'current') {
            return start <= today && today <= end;
        }
        if (filter === 'upcoming') {
            return start > today;
        }
        return true;
    });

    React.useEffect(() => {
        if (activeCampaigns.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % activeCampaigns.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [activeCampaigns.length]);

    const handleCreateCampaign = async (e) => {
        e.preventDefault();
        try {
            const response = await apiClient.post('/funding/campaigns', newCampaign);
            const result = response.data;
            setCampaigns([result.data, ...campaigns]);
            setActiveTab('manage');
            setNewCampaign({ title: '', description: '', goalAmount: '', startDate: '', endDate: '', location: '', purpose: '' });
            alert('Campaign launched successfully!');
        } catch (error) {
            console.error('API failed, mock creation:', error);
            const themes = ['blue', 'green', 'yellow'];
            const campaign = {
                ...newCampaign,
                id: `CAMP-00${campaigns.length + 1}`,
                raisedAmount: 0,
                volunteers: 0,
                volunteersList: [],
                status: 'active',
                theme: themes[campaigns.length % 3],
                image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=1200&auto=format&fit=crop',
                banner: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=1600&auto=format&fit=crop',
                startTime: '09:00 AM'
            };
            setCampaigns([campaign, ...campaigns]);
            setActiveTab('manage');
            setNewCampaign({ title: '', description: '', goalAmount: '', startDate: '', endDate: '', location: '', purpose: '' });
            alert('Launched (Mock Mode)');
        }
    };

    const calculateDaysLeft = (endDate) => {
        const diff = new Date(endDate) - new Date();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days > 0 ? days : 0;
    };

    const tabs = [
        { id: 'manage', label: 'Manage Campaigns' },
        { id: 'create', label: 'Launch New' }
    ];

    if (isLoading) return <ActionLoader message="Loading campaigns..." />;

    return (
        <div className="vet-dashboard vet-campaign-page">
            <div className="campaign-hero-section">        
                <div className="campaigns-scroll-container">
                    {activeCampaigns.map((campaign, index) => (
                        <CampaignHeroCard 
                            key={campaign.id} 
                            campaign={campaign} 
                            isActive={index === currentSlide}
                            calculateDaysLeft={calculateDaysLeft}
                            onDetails={setSelectedCampaign}
                        />
                    ))}
                </div>

                {activeCampaigns.length > 1 && (
                    <div className="carousel-dots">
                        {activeCampaigns.map((_, index) => (
                            <div 
                                key={index} 
                                className={`dot ${index === currentSlide ? 'active' : ''}`}
                                onClick={() => setCurrentSlide(index)}
                            ></div>
                        ))}
                    </div>
                )}
            </div>

            <VetTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="campaign-content-container">
                {activeTab === 'manage' ? (
                    <>
                        <div className="campaign-filters">
                            <button 
                                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                                onClick={() => setFilter('all')}
                            >
                                All
                            </button>
                            <button 
                                className={`filter-btn ${filter === 'current' ? 'active' : ''}`}
                                onClick={() => setFilter('current')}
                            >
                                Current
                            </button>
                            <button 
                                className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
                                onClick={() => setFilter('upcoming')}
                            >
                                Upcoming
                            </button>
                        </div>
                        <div className="campaign-manage-list">
                            {filteredCampaigns.length > 0 ? (
                                filteredCampaigns.map(campaign => (
                                    <CampaignListItem 
                                        key={campaign.id} 
                                        campaign={campaign} 
                                        calculateDaysLeft={calculateDaysLeft}
                                        onDetails={setSelectedCampaign}
                                    />
                                ))
                            ) : (
                                <div className="no-campaigns">No campaigns found for this filter.</div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="create-campaign-container">
                        <form onSubmit={handleCreateCampaign} className="form-grid">
                            <div className="form-group full-width">
                                <label><Type size={16} style={{ marginRight: '8px' }} />Campaign Title</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Stray Feeding Drive 2026" 
                                    required 
                                    value={newCampaign.title}
                                    onChange={e => setNewCampaign({...newCampaign, title: e.target.value})}
                                />
                            </div>

                            <div className="form-group full-width">
                                <label><FileText size={16} style={{ marginRight: '8px' }} />Short Description</label>
                                <input 
                                    type="text"
                                    placeholder="A brief summary for the list view..." 
                                    required
                                    value={newCampaign.description}
                                    onChange={e => setNewCampaign({...newCampaign, description: e.target.value})}
                                />
                            </div>

                            <div className="form-group full-width">
                                <label><Info size={16} style={{ marginRight: '8px' }} />Detailed Purpose</label>
                                <textarea 
                                    rows="3" 
                                    placeholder="Explain the mission and goals in detail..." 
                                    required
                                    value={newCampaign.purpose}
                                    onChange={e => setNewCampaign({...newCampaign, purpose: e.target.value})}
                                ></textarea>
                            </div>

                            <div className="form-group">
                                <label><Target size={16} style={{ marginRight: '8px' }} />Goal Amount ($)</label>
                                <input 
                                    type="number" 
                                    placeholder="5000" 
                                    required 
                                    value={newCampaign.goalAmount}
                                    onChange={e => setNewCampaign({...newCampaign, goalAmount: e.target.value})}
                                />
                            </div>

                            <div className="form-group">
                                <label><MapPin size={16} style={{ marginRight: '8px' }} />Location</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Central Park, Sector 4" 
                                    required 
                                    value={newCampaign.location}
                                    onChange={e => setNewCampaign({...newCampaign, location: e.target.value})}
                                />
                            </div>

                            <div className="form-group">
                                <label><Calendar size={16} style={{ marginRight: '8px' }} />Start Date</label>
                                <input 
                                    type="date" 
                                    required 
                                    value={newCampaign.startDate}
                                    onChange={e => setNewCampaign({...newCampaign, startDate: e.target.value})}
                                />
                            </div>

                            <div className="form-group">
                                <label><Calendar size={16} style={{ marginRight: '8px' }} />End Date</label>
                                <input 
                                    type="date" 
                                    required 
                                    value={newCampaign.endDate}
                                    onChange={e => setNewCampaign({...newCampaign, endDate: e.target.value})}
                                />
                            </div>

                            <div className="form-group full-width">
                                <button type="submit" className="submit-campaign-btn">
                                    <Plus size={20} /> Launch Campaign
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {selectedCampaign && (
                <CampaignDetailModal 
                    campaign={campaigns.find(c => c.id === selectedCampaign.id) || selectedCampaign} 
                    onClose={() => setSelectedCampaign(null)} 
                    onRefresh={fetchCampaigns}
                />
            )}
        </div>
    );
}

export default VetCampaign;


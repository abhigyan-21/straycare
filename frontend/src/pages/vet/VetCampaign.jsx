import React, { useState } from 'react';
import '../../styles/VetDashboard.css';
import '../../styles/VetCampaign.css';
import '../../styles/VetAdopt.css';
import { Plus, Type, FileText, Target, Calendar, MapPin, Info } from 'lucide-react';
import CampaignHeroCard from '../../components/vet/CampaignHeroCard';
import CampaignListItem from '../../components/vet/CampaignListItem';
import VetTabs from '../../components/vet/VetTabs';
import CampaignDetailModal from '../../components/vet/CampaignDetailModal';

const MOCK_CAMPAIGNS = [
    {
        id: 'CAMP-001',
        title: 'Support feeding our pets',
        description: 'Providing warm blankets and insulated shelters for 50+ stray dogs in the northern suburbs.',
        purpose: 'To ensure every stray animal in the northern suburbs has access to nutritional food and warm shelter during the winter months.',
        goalAmount: 5000,
        raisedAmount: 3250,
        volunteers: 24,
        volunteersList: ['Sarah Connor', 'James Smith', 'Emily Blunt', 'Mark Ruffalo', 'Scarlett J.'],
        startDate: '2026-11-01',
        endDate: '2026-12-25',
        startTime: '09:00 AM',
        location: 'Northern Suburbs Community Center',
        status: 'active',
        theme: 'blue',
        image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=1200&auto=format&fit=crop',
        banner: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=1600&auto=format&fit=crop'
    },
    {
        id: 'CAMP-002',
        title: 'Support treatment of our pets',
        description: 'Raising funds for critical surgeries and medical supplies for accident-prone areas.',
        purpose: 'Providing emergency medical care and long-term rehabilitation for animals injured in road accidents.',
        goalAmount: 8000,
        raisedAmount: 1200,
        volunteers: 8,
        volunteersList: ['Dr. Aris', 'Nurse Joy', 'Peter Parker'],
        startDate: '2026-04-15',
        endDate: '2026-05-15',
        startTime: '10:00 AM',
        location: 'Central Veterinary Hospital',
        status: 'active',
        theme: 'green',
        image: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?q=80&w=1200&auto=format&fit=crop',
        banner: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?q=80&w=1600&auto=format&fit=crop'
    },
    {
        id: 'CAMP-003',
        title: 'Support providing shelter for our pets',
        description: 'Anti-rabies and DHPP vaccination drive for street animals in Sector 4 and 5.',
        purpose: 'Eradicating rabies and ensuring the health of the stray population through massive vaccination drives.',
        goalAmount: 3000,
        raisedAmount: 3000,
        volunteers: 45,
        volunteersList: ['Tony Stark', 'Steve Rogers', 'Natasha R.'],
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        startTime: '08:00 AM',
        location: 'Sector 4 Public Park',
        status: 'active',
        theme: 'yellow',
        image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1200&auto=format&fit=crop',
        banner: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1600&auto=format&fit=crop'
    }
];

function VetCampaign() {
    const [activeTab, setActiveTab] = useState('manage');
    const [campaigns, setCampaigns] = useState(MOCK_CAMPAIGNS);
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

    const activeCampaigns = campaigns.filter(c => c.status === 'active');

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

    const handleCreateCampaign = (e) => {
        e.preventDefault();
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
                    campaign={selectedCampaign} 
                    onClose={() => setSelectedCampaign(null)} 
                />
            )}
        </div>
    );
}

export default VetCampaign;


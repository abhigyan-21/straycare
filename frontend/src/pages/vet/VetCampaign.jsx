import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import '../../styles/vet/VetDashboard.css';
import '../../styles/vet/VetCampaign.css';
import '../../styles/vet/VetAdopt.css';
import { Plus, Type, FileText, Target, Calendar, MapPin, Info } from 'lucide-react';
import CampaignHeroCard from '../../components/vet/CampaignHeroCard';
import CampaignListItem from '../../components/vet/CampaignListItem';
import VetTabs from '../../components/vet/VetTabs';
import CampaignDetailModal from '../../components/vet/CampaignDetailModal';
import ActionLoader from '../../components/ActionLoader';
import apiClient, { getCampaignEndDate, isActiveCampaign } from '../../services/api';
import { useVetDataStore } from '../../store/vetDataStore';

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
        purpose: '',
        theme: 'blue',
        startTime: '09:00 AM',
        customTheme: '',
        customImage: '',
        customBanner: '',
        requestType: 'CAMPAIGN',
        bannerFile: null
    });

    const { fetchCampaigns: fetchCampaignsFromStore, invalidateCampaigns } = useVetDataStore();

    const fetchCampaigns = async (force = false) => {
        setIsLoading(true);
        const startTime = Date.now();
        try {
            const data = await fetchCampaignsFromStore(force);
            setCampaigns(data || []);
        } catch (error) {
            console.warn("Failed to fetch campaigns:", error);
            setCampaigns([]);
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

    const activeCampaigns = campaigns.filter(isActiveCampaign);

    const filteredCampaigns = campaigns.filter(c => {
        if (filter === 'all') return true;
        const today = new Date();
        const start = new Date(c.startDate);
        const endDate = getCampaignEndDate(c);
        const end = endDate ? new Date(endDate) : null;

        if (filter === 'current') {
            return start <= today && (!end || today <= end);
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

        let themeVal = newCampaign.theme;
        let imageVal = '';
        let bannerVal = '';

        const presetImages = {
            blue: {
                image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=1200&auto=format&fit=crop',
                banner: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=1600&auto=format&fit=crop'
            },
            green: {
                image: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?q=80&w=1200&auto=format&fit=crop',
                banner: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?q=80&w=1600&auto=format&fit=crop'
            },
            yellow: {
                image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1200&auto=format&fit=crop',
                banner: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1600&auto=format&fit=crop'
            }
        };

        if (newCampaign.theme === 'custom') {
            themeVal = newCampaign.customTheme || 'purple';
            imageVal = newCampaign.customImage || presetImages.blue.image;
            bannerVal = newCampaign.customBanner || presetImages.blue.banner;
        } else {
            const presets = presetImages[newCampaign.theme] || presetImages.blue;
            imageVal = presets.image;
            bannerVal = presets.banner;
        }

        const formData = new FormData();
        formData.append('title', newCampaign.title);
        formData.append('description', newCampaign.description);
        formData.append('goalAmount', newCampaign.goalAmount);
        formData.append('startDate', newCampaign.startDate);
        formData.append('endDate', newCampaign.endDate);
        formData.append('location', newCampaign.location);
        formData.append('purpose', newCampaign.purpose);
        formData.append('startTime', newCampaign.startTime);
        formData.append('theme', themeVal);
        formData.append('image', imageVal);
        formData.append('banner', bannerVal);
        formData.append('requestType', newCampaign.requestType);

        if (newCampaign.bannerFile) {
            formData.append('bannerFile', newCampaign.bannerFile);
        }

        try {
            const response = await apiClient.post('/funding/campaigns', formData);
            const result = response.data;
            invalidateCampaigns();
            setCampaigns([result.data, ...campaigns]);
            setActiveTab('manage');
            setNewCampaign({
                title: '', description: '', goalAmount: '', startDate: '', endDate: '', location: '', purpose: '',
                theme: 'blue', startTime: '09:00 AM', customTheme: '', customImage: '', customBanner: '', requestType: 'CAMPAIGN', bannerFile: null
            });
            alert('Campaign launched successfully!');
        } catch (error) {
            console.error('Failed to launch campaign:', error);
            alert(`Failed to launch campaign: ${error.response?.data?.message || error.message}`);
        }
    };

    const calculateDaysLeft = (endDate) => {
        if (!endDate) return 0;
        const diff = new Date(endDate) - new Date();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days > 0 ? days : 0;
    };

    const tabs = [
        { id: 'manage', label: 'Manage Campaigns / Requests' },
        { id: 'create', label: 'Create a Campaign/Request' }
    ];

    if (isLoading) return <ActionLoader message="Loading campaigns..." />;

    return (
        <>
            <Helmet>
                <title>Furzo Vet Portal - Campaigns</title>
                <meta name="description" content="Create, manage, and monitor animal welfare fundraising campaigns for your clinic on the Furzo Vet Portal." />
            </Helmet>
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
                                    <label><Type size={16} style={{ marginRight: '8px' }} />Type</label>
                                    <select
                                        required
                                        value={newCampaign.requestType}
                                        onChange={e => setNewCampaign({ ...newCampaign, requestType: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '14px 18px',
                                            borderRadius: '14px',
                                            border: '1.5px solid #eee',
                                            fontFamily: "'Outfit', sans-serif",
                                            fontSize: '1rem',
                                            marginBottom: '1rem'
                                        }}
                                    >
                                        <option value="CAMPAIGN">Campaign</option>
                                        <option value="SUPPORT_REQUEST">Support Request</option>
                                    </select>
                                </div>

                                <div className="form-group full-width">
                                    <label><Type size={16} style={{ marginRight: '8px' }} />Title</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Stray Feeding Drive 2026"
                                        required
                                        value={newCampaign.title}
                                        onChange={e => setNewCampaign({ ...newCampaign, title: e.target.value })}
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label><FileText size={16} style={{ marginRight: '8px' }} />Short Description</label>
                                    <input
                                        type="text"
                                        placeholder="A brief summary for the list view..."
                                        required
                                        value={newCampaign.description}
                                        onChange={e => setNewCampaign({ ...newCampaign, description: e.target.value })}
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label><Info size={16} style={{ marginRight: '8px' }} />Detailed Purpose</label>
                                    <textarea
                                        rows="3"
                                        placeholder="Explain the mission and goals in detail..."
                                        required
                                        value={newCampaign.purpose}
                                        onChange={e => setNewCampaign({ ...newCampaign, purpose: e.target.value })}
                                    ></textarea>
                                </div>

                                <div className="form-group">
                                    <label><Target size={16} style={{ marginRight: '8px' }} />Goal Amount (₹)</label>
                                    <input
                                        type="number"
                                        placeholder="5000"
                                        required
                                        value={newCampaign.goalAmount}
                                        onChange={e => setNewCampaign({ ...newCampaign, goalAmount: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label><MapPin size={16} style={{ marginRight: '8px' }} />Location</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Central Park, Sector 4"
                                        required
                                        value={newCampaign.location}
                                        onChange={e => setNewCampaign({ ...newCampaign, location: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label><Calendar size={16} style={{ marginRight: '8px' }} />Start Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={newCampaign.startDate}
                                        onChange={e => setNewCampaign({ ...newCampaign, startDate: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label><Calendar size={16} style={{ marginRight: '8px' }} />End Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={newCampaign.endDate}
                                        onChange={e => setNewCampaign({ ...newCampaign, endDate: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label><Calendar size={16} style={{ marginRight: '8px' }} />Start Time</label>
                                    <input
                                        type="time"
                                        required
                                        value={newCampaign.startTime}
                                        onChange={e => setNewCampaign({ ...newCampaign, startTime: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label><Plus size={16} style={{ marginRight: '8px' }} />Campaign Theme</label>
                                    <select
                                        required
                                        value={newCampaign.theme}
                                        onChange={e => setNewCampaign({ ...newCampaign, theme: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '14px 18px',
                                            borderRadius: '14px',
                                            border: '1.5px solid #eee',
                                            fontFamily: "'Outfit', sans-serif",
                                            fontSize: '1rem'
                                        }}
                                    >
                                        <option value="blue">Feeding Drive (Blue theme)</option>
                                        <option value="green">Treatment Drive (Green theme)</option>
                                        <option value="yellow">Shelter Drive (Yellow theme)</option>
                                        <option value="custom">Custom Theme</option>
                                    </select>
                                </div>

                                {newCampaign.theme === 'custom' && (
                                    <>
                                        <div className="form-group">
                                            <label>Custom Theme Name</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. purple, orange"
                                                required
                                                value={newCampaign.customTheme}
                                                onChange={e => setNewCampaign({ ...newCampaign, customTheme: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Custom Image URL</label>
                                            <input
                                                type="url"
                                                placeholder="https://images.unsplash.com/..."
                                                required
                                                value={newCampaign.customImage}
                                                onChange={e => setNewCampaign({ ...newCampaign, customImage: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group full-width">
                                            <label>Custom Banner URL</label>
                                            <input
                                                type="url"
                                                placeholder="https://images.unsplash.com/..."
                                                required
                                                value={newCampaign.customBanner}
                                                onChange={e => setNewCampaign({ ...newCampaign, customBanner: e.target.value })}
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="form-group full-width">
                                    <label><FileText size={16} style={{ marginRight: '8px' }} />Upload Banner Image</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => {
                                            const file = e.target.files[0];
                                            if (file && !file.type.startsWith('image/')) {
                                                alert('Only image files are allowed for the banner!');
                                                e.target.value = '';
                                                setNewCampaign({ ...newCampaign, bannerFile: null });
                                                return;
                                            }
                                            setNewCampaign({ ...newCampaign, bannerFile: file });
                                        }}
                                        style={{
                                            padding: '10px 0'
                                        }}
                                    />
                                    <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
                                        Upload a custom banner image (Optional). If uploaded, it overrides theme presets.
                                    </small>
                                </div>

                                <div className="form-group full-width">
                                    <button type="submit" className="submit-campaign-btn">
                                        <Plus size={20} /> Launch
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
        </>
    );
}

export default VetCampaign;


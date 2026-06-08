import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search } from 'lucide-react';
import '../../styles/user/Help.css';
import { mockPets } from '../../data/mockPets';
import SupportCarousel from '../../components/user/SupportCarousel';
import HighlightCard from '../../components/user/HighlightCard';
import SupportModal from '../../components/user/SupportModal';
import UserCampaignDetailModal from '../../components/user/UserCampaignDetailModal';
import UserCampaignCard from '../../components/user/UserCampaignCard';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../services/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function Help({ openAuthModal }) {
    const { isLoggedIn } = useAuthStore();
    
    const [expandedCard, setExpandedCard] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [shouldAnimate, setShouldAnimate] = useState(true);
    const resetTimeoutRef = useRef(null);

    // Campaigns list state
    const [campaigns, setCampaigns] = useState([]);
    const [highlights, setHighlights] = useState({
        featuredCampaign: null,
        badgeText: "LATEST CAMPAIGN",
        topContributor: null
    });
    const [isLoadingHighlights, setIsLoadingHighlights] = useState(false);
    const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);

    // Search & filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedDirectCampaign, setSelectedDirectCampaign] = useState(null);
    const [showDetailCampaign, setShowDetailCampaign] = useState(null);

    // Volunteering states
    const [hasVolunteered, setHasVolunteered] = useState(false);
    const [volunteerPending, setVolunteerPending] = useState(false);
    const [cooldownRemaining, setCooldownRemaining] = useState(0);
    const countdownIntervalRef = useRef(null);

    const cards = [
        {
            id: 1,
            title: "Support feeding our pets",
            bgImage: mockPets[0].image,
            details: "Your contribution helps us provide nutritious meals to all the stray animals in our care. A regular supply of good food is essential for their health and recovery.",
        },
        {
            id: 2,
            title: "Support treatment of our pets",
            bgImage: mockPets[1].image,
            details: "Medical care is one of our biggest expenses. From vaccinations to emergency surgeries, your support ensures that every pet gets the medical attention they need to thrive.",
        },
        {
            id: 3,
            title: "Support providing shelter for our pets",
            bgImage: mockPets[2].image,
            details: "Help us expand and maintain safe, warm, and comfortable sleeping areas for the animals. A good shelter protects them from the elements and gives them a sense of security.",
        },
        {
            id: 4,
            title: "Join a campaign",
            bgImage: mockPets[3].image,
            details: "Be part of our special initiatives and targeted campaigns. Your involvement can make a massive difference in our community outreach and rescue operations.",
        }
    ];

    const displayCards = [...cards, ...cards.slice(0, 3)];

    // Fetch campaigns from backend
    const fetchCampaigns = async () => {
        setIsLoadingCampaigns(true);
        try {
            const response = await apiClient.get('/funding/campaigns');
            if (response.data && response.data.status === 'success' && response.data.data && response.data.data.length > 0) {
                setCampaigns(response.data.data);
            } else {
                setCampaigns([]);
            }
        } catch (err) {
            console.warn('Backend offline, no campaigns loaded:', err);
            setCampaigns([]);
        } finally {
            setIsLoadingCampaigns(false);
        }
    };

    // Fetch highlights from backend
    const fetchHighlights = async () => {
        setIsLoadingHighlights(true);
        try {
            const response = await apiClient.get('/funding/campaigns/highlights');
            if (response.data && response.data.status === 'success') {
                setHighlights(response.data.data);
            }
        } catch (err) {
            console.warn("Failed to fetch highlights:", err);
        } finally {
            setIsLoadingHighlights(false);
        }
    };

    // Check volunteering status from backend (with local mock fallback)
    const checkVolunteeringStatus = async () => {
        if (!isLoggedIn) {
            setHasVolunteered(false);
            setVolunteerPending(false);
            setCooldownRemaining(0);
            return;
        }

        try {
            const response = await apiClient.get('/funding/campaigns/volunteer/status');
            const json = response.data;
            if (json.status === 'applied') {
                setHasVolunteered(true);
                setVolunteerPending(false);
                setCooldownRemaining(0);
            } else if (json.status === 'pending') {
                setHasVolunteered(true);
                setVolunteerPending(true);
                setCooldownRemaining(json.remainingSeconds || 120);
                startCountdown(json.remainingSeconds || 120);
            } else {
                setHasVolunteered(false);
                setVolunteerPending(false);
                setCooldownRemaining(0);
            }
        } catch (err) {
            // Fallback to localStorage mock volunteering status
            const mockStatus = localStorage.getItem('mock_volunteer_status') || 'none';
            if (mockStatus === 'applied') {
                setHasVolunteered(true);
                setVolunteerPending(false);
                setCooldownRemaining(0);
            } else if (mockStatus === 'pending') {
                const timerEnd = parseInt(localStorage.getItem('mock_volunteer_timer_end') || '0', 10);
                const remaining = Math.max(0, Math.floor((timerEnd - Date.now()) / 1000));
                if (remaining > 0) {
                    setHasVolunteered(true);
                    setVolunteerPending(true);
                    setCooldownRemaining(remaining);
                    startCountdown(remaining);
                } else {
                    // Timer expired while away
                    localStorage.setItem('mock_volunteer_status', 'applied');
                    setHasVolunteered(true);
                    setVolunteerPending(false);
                    setCooldownRemaining(0);
                }
            } else {
                setHasVolunteered(false);
                setVolunteerPending(false);
                setCooldownRemaining(0);
            }
        }
    };

    // Start countdown timer
    const startCountdown = (duration) => {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        let secondsLeft = duration;
        setCooldownRemaining(secondsLeft);
        
        countdownIntervalRef.current = setInterval(() => {
            secondsLeft -= 1;
            setCooldownRemaining(secondsLeft);
            if (secondsLeft <= 0) {
                clearInterval(countdownIntervalRef.current);
                setVolunteerPending(false);
                setHasVolunteered(true);
                // Sync with local storage if mock fallback
                if (localStorage.getItem('mock_volunteer_status') === 'pending') {
                    localStorage.setItem('mock_volunteer_status', 'applied');
                }
            }
        }, 1000);
    };

    // Volunteer Action
    const handleVolunteerRegister = async () => {
        if (!isLoggedIn) {
            openAuthModal('signin');
            return;
        }

        // Helper to register volunteering with coordinates
        const registerWithLocation = async (latitude = null, longitude = null) => {
            try {
                const response = await apiClient.post('/funding/campaigns/volunteer', { lat: latitude, lng: longitude });
                const json = response.data;
                setHasVolunteered(true);
                setVolunteerPending(true);
                const secs = json.remainingSeconds || 120;
                setCooldownRemaining(secs);
                startCountdown(secs);
            } catch (err) {
                // Mock volunteer registration
                localStorage.setItem('mock_volunteer_status', 'pending');
                localStorage.setItem('mock_volunteer_timer_end', (Date.now() + 120 * 1000).toString());
                if (latitude && longitude) {
                    localStorage.setItem('mock_volunteer_lat', latitude.toString());
                    localStorage.setItem('mock_volunteer_lng', longitude.toString());
                }
                setHasVolunteered(true);
                setVolunteerPending(true);
                setCooldownRemaining(120);
                startCountdown(120);
            }
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    registerWithLocation(latitude, longitude);
                },
                (error) => {
                    console.warn("Geolocation query failed/denied, registering without coordinates:", error.message);
                    registerWithLocation(null, null);
                },
                { timeout: 5000 }
            );
        } else {
            console.warn("Geolocation is not supported by this browser, registering without coordinates.");
            registerWithLocation(null, null);
        }
    };

    // Cancel Volunteer Action
    const handleVolunteerCancel = async () => {
        try {
            await apiClient.post('/funding/campaigns/volunteer/cancel');
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            setHasVolunteered(false);
            setVolunteerPending(false);
            setCooldownRemaining(0);
        } catch (err) {
            // Mock volunteer cancellation
            localStorage.setItem('mock_volunteer_status', 'none');
            localStorage.removeItem('mock_volunteer_timer_end');
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            setHasVolunteered(false);
            setVolunteerPending(false);
            setCooldownRemaining(0);
        }
    };

    // Donation fulfillment logic (real API or mock simulation)
    const handleCampaignDonation = async (campaignId, amount) => {
        try {
            await apiClient.post(`/funding/campaigns/${campaignId}/donate-mock`, { amount });
            // Refresh campaigns and highlights to update stats
            await fetchCampaigns();
            await fetchHighlights();
            return true;
        } catch (err) {
            // Simulate donation on frontend
            setCampaigns(prev => prev.map(c => {
                if (c.id === campaignId) {
                    return {
                        ...c,
                        raisedAmount: (c.raisedAmount || 0) + Number(amount)
                    };
                }
                return c;
            }));
            setHighlights(prev => {
                if (prev.featuredCampaign && prev.featuredCampaign.id === campaignId) {
                    return {
                        ...prev,
                        featuredCampaign: {
                            ...prev.featuredCampaign,
                            raisedAmount: (prev.featuredCampaign.raisedAmount || 0) + Number(amount)
                        }
                    };
                }
                return prev;
            });
            return true;
        }
    };

    useEffect(() => {
        fetchCampaigns();
        fetchHighlights();
    }, []);

    useEffect(() => {
        checkVolunteeringStatus();
        return () => {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        };
    }, [isLoggedIn]);

    useEffect(() => {
        if (expandedCard) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [expandedCard]);

    useEffect(() => {
        if (isPaused || expandedCard) return;

        const interval = setInterval(() => {
            setShouldAnimate(true);
            setCurrentIndex((prev) => {
                const next = prev + 1;
                if (next === 4) {
                    resetTimeoutRef.current = setTimeout(() => {
                        setShouldAnimate(false);
                        setCurrentIndex(0);
                    }, 800);
                }
                return next;
            });
        }, 2000);

        return () => {
            clearInterval(interval);
            if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
        };
    }, [isPaused, expandedCard]);

    const handleDotClick = (index) => {
        setShouldAnimate(true);
        setCurrentIndex(index);
    };

    const handleCardClick = (id) => {
        setExpandedCard(id);
    };

    const closeExpanded = () => {
        setExpandedCard(null);
        setSelectedDirectCampaign(null);
    };

    const getBackgroundImage = () => {
        if (expandedCard) {
            const activeCard = cards.find(c => c.id === expandedCard);
            return activeCard ? `url(${activeCard.bgImage})` : 'none';
        }
        return 'none';
    };

    // Classify a campaign into food, treatment, shelter, or other
    const getCampaignCategory = (camp) => {
        const theme = (camp.theme || '').toLowerCase();
        const title = (camp.title || '').toLowerCase();
        const desc = (camp.description || '').toLowerCase();
        const purpose = (camp.purpose || '').toLowerCase();

        const match = (words) => words.some(w => title.includes(w) || desc.includes(w) || purpose.includes(w));

        if (theme === 'blue' || theme === 'feeding' || theme === 'food' || match(['food', 'feed', 'meal', 'nutrition', 'eat'])) {
            return 'food';
        }
        if (theme === 'green' || theme === 'treatment' || match(['treatment', 'medical', 'surgery', 'vaccin', 'vet', 'injur', 'heal', 'cure', 'care'])) {
            return 'treatment';
        }
        if (theme === 'yellow' || theme === 'shelter' || match(['shelter', 'home', 'sleep', 'blanket', 'jacket', 'warmth', 'stay', 'bed', 'facility'])) {
            return 'shelter';
        }
        return 'other';
    };

    // Filter campaigns based on search query and category
    const activeCampaignsList = campaigns.filter(c => c.status === undefined || c.status === 'active' || c.status === 'APPROVED');
    
    const filteredCampaigns = activeCampaignsList.filter(camp => {
        const matchesSearch = searchQuery.trim() === '' || 
            (camp.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
            (camp.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (camp.location || '').toLowerCase().includes(searchQuery.toLowerCase());
            
        const category = getCampaignCategory(camp);
        const matchesCategory = selectedFilter === 'all' || category === selectedFilter;
        
        return matchesSearch && matchesCategory;
    });

    return (
        <>
        <Helmet>
            <title>Furzo - Support & Campaigns</title>
            <meta name="description" content="Support animal welfare campaigns, volunteer for rescues, and donate to help stray animals through Furzo's community platform." />
            <meta property="og:title" content="Furzo - Support & Campaigns" />
            <meta property="og:description" content="Support animal welfare campaigns, volunteer for rescues, and donate to help stray animals through Furzo's community platform." />
            <meta property="og:image" content="https://furzo.vercel.app/FurzoBanner.jpg" />
            <meta property="og:url" content="https://furzo.vercel.app/help" />
            <meta property="og:type" content="website" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="Furzo - Support & Campaigns" />
            <meta name="twitter:description" content="Support animal welfare campaigns, volunteer for rescues, and donate to help stray animals through Furzo's community platform." />
            <meta name="twitter:image" content="https://furzo.vercel.app/FurzoBanner.jpg" />
        </Helmet>
        <div className="help-page">
            <div className="help-content-wrapper">
                <SupportCarousel 
                    displayCards={displayCards}
                    currentIndex={currentIndex}
                    shouldAnimate={shouldAnimate}
                    setIsPaused={setIsPaused}
                    handleCardClick={handleCardClick}
                />

                <div className="carousel-dots">
                    {cards.map((_, index) => (
                        <button
                            key={index}
                            className={`carousel-dot ${index === (currentIndex % 4) ? 'active' : ''}`}
                            onClick={() => handleDotClick(index)}
                        />
                    ))}
                </div>

                {/* Search, Filter, and Campaign List Widget */}
                <div className="campaign-search-section">
                    <div className="search-filter-container">
                        <div className="search-bar-wrapper">
                            <Search className="search-icon" size={20} />
                            <input
                                type="text"
                                className="campaign-search-input"
                                placeholder="search a campaign"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button className="clear-search-btn" onClick={() => setSearchQuery('')}>×</button>
                            )}
                        </div>
                        
                        <div className="category-filters">
                            {[
                                { id: 'all', label: 'All Campaigns' },
                                { id: 'food', label: 'Food & Nutrition' },
                                { id: 'shelter', label: 'Safe Shelter' },
                                { id: 'treatment', label: 'Medical Treatment' },
                                { id: 'other', label: 'Other Support' }
                            ].map((filterItem) => (
                                <button
                                    key={filterItem.id}
                                    className={`filter-pill ${filterItem.id} ${selectedFilter === filterItem.id ? 'active' : ''}`}
                                    onClick={() => {
                                        setSelectedFilter(filterItem.id);
                                        setIsExpanded(false);
                                    }}
                                >
                                    {filterItem.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="campaigns-grid-wrapper">
                        {filteredCampaigns.length === 0 ? (
                            <div className="no-campaigns-found">
                                <p>No active campaigns match your search and filter criteria.</p>
                            </div>
                        ) : (
                            <>
                                <div className="campaigns-grid">
                                    {filteredCampaigns.slice(0, isExpanded ? undefined : 5).map((camp) => {
                                        const progress = camp.goalAmount > 0
                                            ? Math.min(100, Math.round(((camp.raisedAmount || 0) / camp.goalAmount) * 100))
                                            : 0;
                                        const category = getCampaignCategory(camp);

                                        return (
                                            <UserCampaignCard
                                                key={camp.id}
                                                campaign={camp}
                                                category={category}
                                                progress={progress}
                                                onDonate={(selected) => {
                                                    setSelectedDirectCampaign(selected);
                                                    setExpandedCard(4);
                                                }}
                                                onDetails={(selected) => {
                                                    setShowDetailCampaign(selected);
                                                }}
                                            />
                                        );
                                    })}
                                </div>

                                {filteredCampaigns.length > 5 && (
                                    <div className="view-more-container">
                                        <button 
                                            className="view-more-toggle-btn"
                                            onClick={() => setIsExpanded(!isExpanded)}
                                        >
                                            {isExpanded ? 'Show Less' : 'View More'}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {(highlights.featuredCampaign || highlights.topContributor) && (
                <section className="highlights-section">
                    <div className="highlights-header">
                        <h2>Community Highlights</h2>
                        <p>Celebrating our latest efforts and the heroes who make them possible.</p>
                    </div>

                    <div 
                        className="highlights-container"
                        style={{ gridTemplateColumns: highlights.featuredCampaign ? '2fr 1fr' : '1fr' }}
                    >
                        {highlights.featuredCampaign && (
                            <HighlightCard 
                                type="campaign" 
                                campaign={highlights.featuredCampaign} 
                                badgeText={highlights.badgeText}
                                onDonate={(selected) => {
                                    setSelectedDirectCampaign(selected);
                                    setExpandedCard(4);
                                }}
                                onDetails={(selected) => {
                                    setShowDetailCampaign(selected);
                                }}
                            />
                        )}
                        {highlights.topContributor && (
                            <HighlightCard 
                                type="supporter" 
                                contributor={highlights.topContributor} 
                            />
                        )}
                    </div>
                </section>
            )}

            <SupportModal 
                key={expandedCard ? `modal-${expandedCard}-${selectedDirectCampaign?.id || 'none'}` : 'modal-closed'}
                card={cards.find(c => c.id === expandedCard)}
                onClose={closeExpanded}
                isLoggedIn={isLoggedIn}
                hasVolunteered={hasVolunteered}
                volunteerPending={volunteerPending}
                cooldownRemaining={cooldownRemaining}
                onVolunteerRegister={handleVolunteerRegister}
                onVolunteerCancel={handleVolunteerCancel}
                campaigns={campaigns}
                isLoadingCampaigns={isLoadingCampaigns}
                onDonate={handleCampaignDonation}
                getBackgroundImage={getBackgroundImage}
                openAuthModal={openAuthModal}
                initialViewMode={selectedDirectCampaign ? 'payment' : 'main'}
                initialSelectedCampaign={selectedDirectCampaign}
            />

            {showDetailCampaign && (
                <UserCampaignDetailModal 
                    campaign={showDetailCampaign}
                    onClose={() => setShowDetailCampaign(null)}
                    onDonate={(camp) => {
                        setShowDetailCampaign(null);
                        setSelectedDirectCampaign(camp);
                        setExpandedCard(4);
                    }}
                />
            )}
        </div>
        </>
    );
}

export default Help;

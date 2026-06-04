import React, { useState, useEffect, useRef } from 'react';
import '../../styles/user/Help.css';
import { mockPets } from '../../data/mockPets';
import { highlightsData } from '../../data/highlightsData';
import SupportCarousel from '../../components/user/SupportCarousel';
import HighlightCard from '../../components/user/HighlightCard';
import SupportModal from '../../components/user/SupportModal';
import { useAuthStore } from '../../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Fallback ongoing campaigns list
const MOCK_ONGOING_CAMPAIGNS = [
    {
        id: "mock-camp-1",
        title: "Winter Warmth Drive",
        description: "Provide insulated jackets and blankets to strays facing the harsh winter.",
        goalAmount: 50000,
        raisedAmount: 32500,
        image: "https://images.unsplash.com/photo-1599443015574-be5fe8a05783?auto=format&fit=crop&q=80&w=800",
    },
    {
        id: "mock-camp-2",
        title: "Medical Treatment Campaign",
        description: "Emergency fund for treating injured stray dogs and cats.",
        goalAmount: 80000,
        raisedAmount: 45000,
        image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800",
    },
    {
        id: "mock-camp-3",
        title: "Shelter Expansion Project",
        description: "Building safe sleeping spaces and feeding areas at our central facility.",
        goalAmount: 120000,
        raisedAmount: 90000,
        image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=800",
    }
];

function Help({ openAuthModal }) {
    const { isLoggedIn } = useAuthStore();
    
    const [expandedCard, setExpandedCard] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [shouldAnimate, setShouldAnimate] = useState(true);
    const resetTimeoutRef = useRef(null);

    // Campaigns list state
    const [campaigns, setCampaigns] = useState(MOCK_ONGOING_CAMPAIGNS);
    const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);

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
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const res = await fetch(`${API_BASE_URL}/funding/campaigns`, { headers });
            if (res.ok) {
                const json = await res.json();
                if (json.status === 'success' && json.data && json.data.length > 0) {
                    setCampaigns(json.data);
                } else {
                    setCampaigns(MOCK_ONGOING_CAMPAIGNS);
                }
            } else {
                setCampaigns(MOCK_ONGOING_CAMPAIGNS);
            }
        } catch (err) {
            console.warn('Backend offline, using mock campaigns data:', err);
            setCampaigns(MOCK_ONGOING_CAMPAIGNS);
        } finally {
            setIsLoadingCampaigns(false);
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
            const res = await fetch(`${API_BASE_URL}/funding/campaigns/volunteer/status`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const json = await res.json();
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
            } else {
                throw new Error('Status endpoint failed');
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
                const res = await fetch(`${API_BASE_URL}/funding/campaigns/volunteer`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ lat: latitude, lng: longitude })
                });
                if (res.ok) {
                    const json = await res.json();
                    setHasVolunteered(true);
                    setVolunteerPending(true);
                    const secs = json.remainingSeconds || 120;
                    setCooldownRemaining(secs);
                    startCountdown(secs);
                } else {
                    throw new Error('Registration failed');
                }
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
            const res = await fetch(`${API_BASE_URL}/funding/campaigns/volunteer/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (res.ok) {
                if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
                setHasVolunteered(false);
                setVolunteerPending(false);
                setCooldownRemaining(0);
            } else {
                throw new Error('Cancellation failed');
            }
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
            const res = await fetch(`${API_BASE_URL}/funding/campaigns/${campaignId}/donate-mock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ amount })
            });
            if (res.ok) {
                // Refresh campaigns to update raisedAmount
                await fetchCampaigns();
                return true;
            } else {
                throw new Error('Donation endpoint failed');
            }
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
            return true;
        }
    };

    useEffect(() => {
        fetchCampaigns();
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
    };

    const getBackgroundImage = () => {
        if (expandedCard) {
            const activeCard = cards.find(c => c.id === expandedCard);
            return activeCard ? `url(${activeCard.bgImage})` : 'none';
        }
        return 'none';
    };

    return (
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
            </div>

            <section className="highlights-section">
                <div className="highlights-header">
                    <h2>Community Highlights</h2>
                    <p>Celebrating our latest efforts and the heroes who make them possible.</p>
                </div>

                <div className="highlights-container">
                    <HighlightCard type="campaign" data={highlightsData.latestCampaign} />
                    <HighlightCard type="supporter" data={highlightsData.topSupporter} />
                </div>
            </section>

            <SupportModal 
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
            />
        </div>
    );
}

export default Help;

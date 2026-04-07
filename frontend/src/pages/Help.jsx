import React, { useState, useEffect, useRef } from 'react';
import '../styles/Help.css';
import { mockPets } from '../data/mockPets';
import { highlightsData } from '../data/highlightsData';

function Help() {
    const [expandedCard, setExpandedCard] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [shouldAnimate, setShouldAnimate] = useState(true);
    const [hasVolunteered, setHasVolunteered] = useState(false);
    const resetTimeoutRef = useRef(null);

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

    // Cloned cards for infinite effect [A, B, C, D, A, B, C]
    const displayCards = [...cards, ...cards.slice(0, 3)];

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
            const nextIndex = currentIndex + 1;
            setShouldAnimate(true);
            setCurrentIndex(nextIndex);

            // Handle wrap-around from D back to A
            if (nextIndex === 4) {
                resetTimeoutRef.current = setTimeout(() => {
                    setShouldAnimate(false);
                    setCurrentIndex(0);
                }, 850); // Slightly more than calculation to ensure transition finishes
            }
        }, 3800); // 3s pause + 0.8s transition (roughly)

        return () => {
            clearInterval(interval);
            if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
        };
    }, [isPaused, expandedCard, currentIndex]);

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
                <div className="carousel-viewport"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    <div
                        className="help-cards-container"
                        style={{ 
                            transform: `translateX(-${currentIndex * (100 / displayCards.length)}%)`,
                            transition: shouldAnimate ? 'transform 800ms cubic-bezier(0.65, 0, 0.35, 1)' : 'none'
                        }}
                    >
                        {displayCards.map((card, index) => (
                            <div
                                key={`${card.id}-${index}`}
                                className="help-card-wrapper"
                            >
                                <div className="help-card">
                                    <div className="card-bg" style={{ backgroundImage: `url(${card.bgImage})` }}></div>
                                    <div className="card-inner">
                                        <h3>{card.title}</h3>
                                        <button
                                            className="support-btn"
                                            onClick={() => handleCardClick(card.id)}
                                        >
                                            I would like to support
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

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
            </div>

            <section className="highlights-section">
                <div className="highlights-header">
                    <h2>Community Highlights</h2>
                    <p>Celebrating our latest efforts and the heroes who make them possible.</p>
                </div>
                
                <div className="highlights-container">
                    {/* Latest Campaign */}
                    <div className="highlight-card latest-campaign">
                        <div className="highlight-badge">LATEST CAMPAIGN</div>
                        <div className="highlight-content">
                            <div className="highlight-image" style={{ backgroundImage: `url(${highlightsData.latestCampaign.image})` }}></div>
                            <div className="highlight-details">
                                <h3>{highlightsData.latestCampaign.title}</h3>
                                <p>{highlightsData.latestCampaign.description}</p>
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: `${highlightsData.latestCampaign.progress}%` }}></div>
                                </div>
                                <span className="progress-text">{highlightsData.latestCampaign.goalText}</span>
                                <div className="campaign-actions">
                                    <button className="highlight-action-btn primary">{highlightsData.latestCampaign.primaryAction}</button>
                                    <button className="highlight-action-btn secondary">{highlightsData.latestCampaign.secondaryAction}</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Supporter */}
                    <div className="highlight-card top-supporter">
                        <div className="highlight-badge">TOP SUPPORTER</div>
                        <div className="supporter-profile">
                            <div className="supporter-avatar">
                                <img src={highlightsData.topSupporter.avatar} alt={highlightsData.topSupporter.name} />
                            </div>
                            <h3>{highlightsData.topSupporter.name}</h3>
                            <p className="supporter-quote">"{highlightsData.topSupporter.quote}"</p>
                            <div className="supporter-stat">
                                <span className="stat-label">{highlightsData.topSupporter.statLabel}</span>
                                <span className="stat-value">{highlightsData.topSupporter.statValue}</span>
                            </div>
                            <div className="supporter-badge-icon">{highlightsData.topSupporter.badgeIcon}</div>
                        </div>
                    </div>
                </div>
            </section>

            {expandedCard && (
                <div className="help-modal-overlay">
                    <div className="help-modal-backdrop" onClick={closeExpanded}></div>
                    <div className="expanded-card">
                        <div
                            className="expanded-card-bg"
                            style={{ backgroundImage: getBackgroundImage() }}
                        />
                        <button className="close-btn" onClick={closeExpanded}>&times;</button>
                        <div className="expanded-content">
                            <h2>{cards.find(c => c.id === expandedCard)?.title}</h2>
                            <p className="details-text">
                                {cards.find(c => c.id === expandedCard)?.details}
                            </p>

                            <div className="support-actions">
                                <span className="support-prefix">I would like to support by</span>
                                <button className="action-btn">Donating</button>
                                {expandedCard === 4 ? (
                                    <button 
                                        className="action-btn" 
                                        style={{ 
                                            backgroundColor: hasVolunteered ? '#ccc' : '', 
                                            color: hasVolunteered ? '#666' : '',
                                            cursor: hasVolunteered ? 'default' : 'pointer'
                                        }}
                                        onClick={() => {
                                            if (!hasVolunteered) {
                                                alert("Thank you for your support we'll send you details of our future campaigns you may join us in them.");
                                                setHasVolunteered(true);
                                            }
                                        }}
                                    >
                                        {hasVolunteered ? "sorry I wouldn't volunteer" : "I would like to volunteer"}
                                    </button>
                                ) : (
                                    <button className="action-btn outline">starting a autopay</button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Help;

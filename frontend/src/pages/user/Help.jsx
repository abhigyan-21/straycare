import React, { useState, useEffect, useRef } from 'react';
import '../../styles/user/Help.css';
import { mockPets } from '../../data/mockPets';
import { highlightsData } from '../../data/highlightsData';
import SupportCarousel from '../../components/user/SupportCarousel';
import HighlightCard from '../../components/user/HighlightCard';
import SupportModal from '../../components/user/SupportModal';

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

    const handleVolunteer = () => {
        alert("Thank you for your support we'll send you details of our future campaigns you may join us in them.");
        setHasVolunteered(true);
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
                hasVolunteered={hasVolunteered}
                onVolunteer={handleVolunteer}
                getBackgroundImage={getBackgroundImage}
            />
        </div>
    );
}

export default Help;


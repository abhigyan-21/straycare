import React, { useState, useEffect } from 'react';
import '../styles/Help.css';
import { mockPets } from '../data/mockPets';

function Help() {
    const [expandedCard, setExpandedCard] = useState(null);

    useEffect(() => {
        if (expandedCard) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }

        // Cleanup to ensure scroll is restored if component unmounts
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [expandedCard]);

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
        }
    ];

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
                <div className="help-cards-container">
                    {cards.map((card) => (
                        <div
                            key={card.id}
                            className="help-card"
                        >
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
                    ))}
                </div>
            </div>

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
                                <button className="action-btn outline">starting a autopay</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Help;

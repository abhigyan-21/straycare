import React from 'react';

const SupportCarousel = ({ displayCards, currentIndex, shouldAnimate, setIsPaused, handleCardClick }) => {
    return (
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
        </div>
    );
};

export default SupportCarousel;

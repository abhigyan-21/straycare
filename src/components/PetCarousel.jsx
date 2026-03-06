import React from 'react';

const PetCarousel = ({ pets, currentIndex, onNext, onPrev }) => {
    if (!pets || pets.length === 0) {
        return (
            <div className="pet-carousel empty">
                <p>No pets found matching your criteria.</p>
            </div>
        );
    }

    // Calculate indices for previous and next cards if they exist
    // We want to show a layered effect: current in middle, prev slightly behind left, next slightly behind right.
    const prevIndex = currentIndex - 1;
    const nextIndex = currentIndex + 1;

    const hasPrev = prevIndex >= 0;
    const hasNext = nextIndex < pets.length;

    return (
        <div className="pet-carousel-container">
            <div className="carousel-nav left">
                <button
                    onClick={onPrev}
                    disabled={!hasPrev}
                    className={!hasPrev ? 'nav-arrow disabled' : 'nav-arrow'}
                >
                    &#9664;
                </button>
            </div>

            <div className="carousel-view">
                {hasPrev && (
                    <div className="pet-card pet-card-prev" onClick={onPrev}>
                        <div className="image-overlay"></div>
                        <img src={pets[prevIndex].image} alt={pets[prevIndex].name} />
                    </div>
                )}

                <div className="pet-card pet-card-current">
                    <img src={pets[currentIndex].image} alt={pets[currentIndex].name} />
                </div>

                {hasNext && (
                    <div className="pet-card pet-card-next" onClick={onNext}>
                        <div className="image-overlay"></div>
                        <img src={pets[nextIndex].image} alt={pets[nextIndex].name} />
                    </div>
                )}
            </div>

            <div className="carousel-nav right">
                <button
                    onClick={onNext}
                    disabled={!hasNext}
                    className={!hasNext ? 'nav-arrow disabled' : 'nav-arrow'}
                >
                    &#9654;
                </button>
            </div>
        </div>
    );
};

export default PetCarousel;

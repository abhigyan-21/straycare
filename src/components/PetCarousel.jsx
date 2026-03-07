import React, { useState, useEffect } from 'react';

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

    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches ? e.targetTouches[0].clientX : e.clientX);
        setIsDragging(true);
    };

    const onTouchMove = (e) => {
        if (!isDragging && !e.targetTouches) return;
        setTouchEnd(e.targetTouches ? e.targetTouches[0].clientX : e.clientX);
    };

    const onTouchEndHandler = () => {
        setIsDragging(false);
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe && hasNext) {
            onNext();
        }
        if (isRightSwipe && hasPrev) {
            onPrev();
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === 'ArrowLeft' && hasPrev) {
                onPrev();
            } else if (e.key === 'ArrowRight' && hasNext) {
                onNext();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hasPrev, hasNext, onPrev, onNext]);

    return (
        <div
            className={`pet-carousel-container ${isDragging ? 'dragging' : ''}`}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEndHandler}
            onMouseDown={onTouchStart}
            onMouseMove={onTouchMove}
            onMouseUp={onTouchEndHandler}
            onMouseLeave={onTouchEndHandler}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
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

                <div className="pet-card pet-card-current" style={{ pointerEvents: isDragging ? 'none' : 'auto' }}>
                    <img src={pets[currentIndex].image} alt={pets[currentIndex].name} draggable="false" />
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

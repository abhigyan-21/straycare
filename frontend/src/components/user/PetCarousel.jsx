import React, { useState, useEffect } from 'react';

const PetCarousel = ({ pets, currentIndex, onNext, onPrev, onInterested, isInterested }) => {
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

    const currentPet = pets[currentIndex];

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

                <div className={`pet-card pet-card-current ${isInterested ? 'interested-state' : ''}`} style={{ display: 'flex', flexDirection: 'row' }}>
                    <div className="pet-image-side">
                        <img src={currentPet.image} alt={currentPet.name} draggable="false" />
                    </div>
                    <div className="pet-profile-side">
                        <div className="pet-details-scrollable">
                            {isInterested ? (
                                <div className="interested-message-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', textAlign: 'center' }}>
                                    <h3 style={{ fontSize: '1.8rem', color: '#444', marginBottom: '15px', fontWeight: '500', lineHeight:'1.4' }}>
                                        Thanks for showing your<br/>interest in<br/>{currentPet.name}
                                    </h3>
                                    <p style={{ fontSize: '1.2rem', color: '#666' }}>You'll receive update soon</p>
                                </div>
                            ) : (
                                <>
                                    <h3 className="desktop-profile-title">Profile</h3>

                                    <h2 className="pet-name mobile-only-item">{currentPet.name}</h2>
                                    <div className="pet-detail-row desktop-only-item">
                                        <span className="detail-label">Name:</span> {currentPet.name}
                                    </div>

                                    <div className="pet-detail-row">
                                        <span className="detail-label">Breed:</span> {currentPet.breed}
                                    </div>
                                    <div className="pet-detail-row">
                                        <span className="detail-label">Age:</span> {currentPet.age}
                                    </div>
                                    <div className="pet-detail-row">
                                        <span className="detail-label">Sex:</span> {currentPet.sex}
                                    </div>

                                    <div className="pet-detail-row full-width mt-2">
                                        <span className="detail-label block">Medical history:</span> {currentPet.medicalHistory}
                                    </div>
                                    <div className="pet-detail-row full-width mt-2">
                                        <span className="detail-label block">Hobbies:</span> {currentPet.hobbies}
                                    </div>
                                    <div className="pet-detail-row full-width mt-2">
                                        <span className="detail-label block">Talents:</span> {currentPet.talents}
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="action-container-overlay">
                            <button
                                className={`btn-interested-overlay ${isInterested ? 'interested-marked' : ''}`}
                                onClick={() => onInterested(currentPet)}
                            >
                                {isInterested ? "I'll adopt someone else" : 'Interested'}
                            </button>
                        </div>
                    </div>
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

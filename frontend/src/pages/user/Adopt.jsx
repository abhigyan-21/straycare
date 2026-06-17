import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import '../../styles/user/Adopt.css';
import PetCarousel from '../../components/user/PetCarousel';
import FilterModal from '../../components/user/FilterModal';
import ActionLoader from '../../components/ActionLoader';
import { useAdoptionStore } from '../../store/adoptionStore';

function Adopt() {
    const {
        pets,
        loading,
        fetchPetsAndRequests,
        submitInterest,
        cancelInterest,
        isInterested,
    } = useAdoptionStore();

    const [currentPetIndex, setCurrentPetIndex] = useState(0);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [filters, setFilters] = useState({
        type: '',
        breed: '',
        ageGroup: ''
    });

    useEffect(() => {
        fetchPetsAndRequests();
    }, [fetchPetsAndRequests]);

    const filteredPets = useMemo(() => {
        return pets.filter(pet => {
            if (pet.status !== 'AVAILABLE') return false;
            let match = true;
            if (filters.type && pet.type !== filters.type) match = false;
            if (filters.breed && (!pet.breed || !pet.breed.toLowerCase().includes(filters.breed.toLowerCase()))) match = false;
            if (filters.ageGroup && pet.ageGroup !== filters.ageGroup) match = false;
            return match;
        });
    }, [filters, pets]);

    // Adjust index if filtering makes it out of bounds
    React.useEffect(() => {
        if (currentPetIndex >= filteredPets.length) {
            setCurrentPetIndex(0);
        }
    }, [filteredPets, currentPetIndex]);

    const handleNext = () => {
        if (currentPetIndex < filteredPets.length - 1) {
            setCurrentPetIndex(currentPetIndex + 1);
        }
    };

    const handlePrev = () => {
        if (currentPetIndex > 0) {
            setCurrentPetIndex(currentPetIndex - 1);
        }
    };

    const handleApplyFilters = (newFilters) => {
        setFilters(newFilters);
        setIsFilterModalOpen(false);
        setCurrentPetIndex(0);
    };

    const handleInterested = async (pet) => {
        if (isInterested(pet.id)) {
            try {
                await cancelInterest(pet);
            } catch {
                alert('Failed to cancel adoption request. Please try again.');
            }
        } else {
            try {
                await submitInterest(pet);
            } catch {
                alert('Failed to submit adoption request. Please try again.');
            }
        }
    };

    // Only show full loader on true cold start (no cached data at all)
    if (loading && pets.length === 0) {
        return <ActionLoader message="Loading pets..." />;
    }

    return (
        <>
            <Helmet>
                <title>Furzo - Adopt a Pet</title>
                <meta name="description" content="Browse rescued animals available for adoption. Find your perfect furry companion through Furzo's pet adoption platform." />
                <meta property="og:title" content="Furzo - Adopt a Pet" />
                <meta property="og:description" content="Browse rescued animals available for adoption. Find your perfect furry companion through Furzo's pet adoption platform." />
                <meta property="og:image" content="https://Furzo.vercel.app/FurzoBanner.jpg" />
                <meta property="og:url" content="https://Furzo.vercel.app/adopt" />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Furzo - Adopt a Pet" />
                <meta name="twitter:description" content="Browse rescued animals available for adoption. Find your perfect furry companion through Furzo's pet adoption platform." />
                <meta name="twitter:image" content="https://Furzo.vercel.app/FurzoBanner.jpg" />
            </Helmet>
            <div className="adopt-page">
                <div className="adopt-toolbar">
                    <button
                        className="btn-filter"
                        onClick={() => setIsFilterModalOpen(true)}
                    >
                        Filters
                    </button>
                </div>

                <div className="adopt-content">
                    <div className="carousel-section">
                        {filteredPets.length > 0 ? (
                            <PetCarousel
                                pets={filteredPets}
                                currentIndex={currentPetIndex}
                                onNext={handleNext}
                                onPrev={handlePrev}
                                onInterested={handleInterested}
                                isInterested={isInterested(filteredPets[currentPetIndex].id)}
                            />
                        ) : (
                            <div className="no-pets-message">
                                <p>No pets found matching your criteria. Please adjust your filters.</p>
                            </div>
                        )}
                    </div>
                </div>

                <FilterModal
                    isOpen={isFilterModalOpen}
                    onClose={() => setIsFilterModalOpen(false)}
                    onApply={handleApplyFilters}
                    currentFilters={filters}
                />
            </div>
        </>
    );
}

export default Adopt;
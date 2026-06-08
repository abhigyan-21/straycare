import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import '../../styles/user/Adopt.css';
import { getPets, submitAdoptionRequest } from '../../services/api';
import PetCarousel from '../../components/user/PetCarousel';
import FilterModal from '../../components/user/FilterModal';

function Adopt() {
    const [pets, setPets] = useState([]);
    const [currentPetIndex, setCurrentPetIndex] = useState(0);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [interestedPets, setInterestedPets] = useState(new Set());
    const [filters, setFilters] = useState({
        type: '',
        breed: '',
        ageGroup: ''
    });

    useEffect(() => {
        const fetchPets = async () => {
            const data = await getPets();
            setPets(data);
        };
        fetchPets();
    }, []);

    const filteredPets = useMemo(() => {
        return pets.filter(pet => {
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
        setCurrentPetIndex(0); // reset index when filters change
    };

    const handleInterested = async (pet) => {
        const isCurrentlyInterested = interestedPets.has(pet.id);
        if (isCurrentlyInterested) {
            // Toggle off locally
            setInterestedPets(prev => {
                const newSet = new Set(prev);
                newSet.delete(pet.id);
                return newSet;
            });
            return;
        }

        try {
            await submitAdoptionRequest(pet.id);
            setInterestedPets(prev => {
                const newSet = new Set(prev);
                newSet.add(pet.id);
                return newSet;
            });
        } catch (error) {
            console.error('Failed to submit adoption request:', error);
            alert('Failed to submit adoption request. Please try again.');
        }
    };

    return (
        <>
        <Helmet>
            <title>Furzo - Adopt a Pet</title>
            <meta name="description" content="Browse rescued animals available for adoption. Find your perfect furry companion through Furzo's pet adoption platform." />
            <meta property="og:title" content="Furzo - Adopt a Pet" />
            <meta property="og:description" content="Browse rescued animals available for adoption. Find your perfect furry companion through Furzo's pet adoption platform." />
            <meta property="og:image" content="https://furzo.vercel.app/FurzoBanner.jpg" />
            <meta property="og:url" content="https://furzo.vercel.app/adopt" />
            <meta property="og:type" content="website" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="Furzo - Adopt a Pet" />
            <meta name="twitter:description" content="Browse rescued animals available for adoption. Find your perfect furry companion through Furzo's pet adoption platform." />
            <meta name="twitter:image" content="https://furzo.vercel.app/FurzoBanner.jpg" />
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
                            isInterested={interestedPets.has(filteredPets[currentPetIndex].id)}
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
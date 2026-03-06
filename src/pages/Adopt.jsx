import React, { useState, useMemo } from 'react';
import '../styles/Adopt.css';
import { mockPets } from '../data/mockPets';
import PetCarousel from '../components/PetCarousel';
import PetProfile from '../components/PetProfile';
import FilterModal from '../components/FilterModal';

function Adopt() {
    const [currentPetIndex, setCurrentPetIndex] = useState(0);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [interestedPets, setInterestedPets] = useState(new Set());
    const [filters, setFilters] = useState({
        type: '',
        breed: '',
        color: '',
        ageGroup: ''
    });

    const filteredPets = useMemo(() => {
        return mockPets.filter(pet => {
            let match = true;
            if (filters.type && pet.type !== filters.type) match = false;
            if (filters.breed && !pet.breed.toLowerCase().includes(filters.breed.toLowerCase())) match = false;
            if (filters.color && !pet.color.toLowerCase().includes(filters.color.toLowerCase())) match = false;
            if (filters.ageGroup && pet.ageGroup !== filters.ageGroup) match = false;
            return match;
        });
    }, [filters]);

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

    const handleInterested = (pet) => {
        setInterestedPets(prev => {
            const newSet = new Set(prev);
            if (newSet.has(pet.id)) {
                newSet.delete(pet.id);
            } else {
                newSet.add(pet.id);
            }
            return newSet;
        });
    };

    return (
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
                        />
                    ) : (
                        <div className="no-pets-message">
                            <p>No pets found matching your criteria. Please adjust your filters.</p>
                        </div>
                    )}
                </div>

                <div className="profile-section">
                    <PetProfile
                        pet={filteredPets[currentPetIndex]}
                        onInterested={handleInterested}
                        isInterested={filteredPets.length > 0 && interestedPets.has(filteredPets[currentPetIndex].id)}
                    />
                </div>
            </div>

            <FilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                onApply={handleApplyFilters}
                currentFilters={filters}
            />
        </div>
    );
}

export default Adopt;
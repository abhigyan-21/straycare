import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import '../../styles/user/Adopt.css';
import PetCarousel from '../../components/user/PetCarousel';
import FilterModal from '../../components/user/FilterModal';
import ActionLoader from '../../components/ActionLoader';
import { useAdoptionStore } from '../../store/adoptionStore';
import PullToRefresh from 'react-simple-pull-to-refresh';
import { Search, LocateFixed } from 'lucide-react';

function Adopt() {
    const {
        pets,
        loading,
        fetchPetsAndRequests,
        submitInterest,
        cancelInterest,
        isInterested,
        invalidateCache,
        setLocation,
        setMaxDistance,
        userLat,
        userLng,
        locationName,
        maxDistance
    } = useAdoptionStore();

    const [currentPetIndex, setCurrentPetIndex] = useState(0);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [filters, setFilters] = useState({
        type: '',
        breed: '',
        ageGroup: '',
        maxDistance: maxDistance || 50
    });
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [locationSearch, setLocationSearch] = useState(locationName || '');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSelectingSuggestion, setIsSelectingSuggestion] = useState(false);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (isSelectingSuggestion || locationSearch.trim().length < 3 || locationSearch === locationName) {
                setSuggestions([]);
                setShowSuggestions(false);
                return;
            }
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationSearch)}&countrycodes=in&limit=5&addressdetails=1`);
                const data = await res.json();
                setSuggestions(data || []);
                setShowSuggestions(true);
            } catch (err) {
                console.error('Error fetching suggestions:', err);
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 500);
        return () => clearTimeout(timeoutId);
    }, [locationSearch, isSelectingSuggestion, locationName]);

    useEffect(() => {
        if (!userLat && navigator.geolocation) {
             navigator.geolocation.getCurrentPosition(
                async (position) => {
                    setIsSelectingSuggestion(true);
                    let city = "Current Location";
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
                        const data = await res.json();
                        city = data.address?.city || data.address?.town || data.address?.village || data.address?.state_district || "Current Location";
                        setLocationSearch(city);
                    } catch {
                        setLocationSearch(city);
                    }
                    setLocation(position.coords.latitude, position.coords.longitude, city);
                    fetchPetsAndRequests(true);
                    setTimeout(() => setIsSelectingSuggestion(false), 800);
                },
                () => {
                    fetchPetsAndRequests();
                }
            );
        } else if (userLat && userLng && !locationSearch) {
             setLocationSearch(locationName || "Current Location");
             fetchPetsAndRequests();
        } else {
            fetchPetsAndRequests();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    const handleApplyFilters = async (newFilters) => {
        setFilters(newFilters);
        if (newFilters.maxDistance && newFilters.maxDistance !== maxDistance) {
            setMaxDistance(newFilters.maxDistance);
            await fetchPetsAndRequests(true);
        } else if (!newFilters.maxDistance && maxDistance) {
            setMaxDistance(null);
            await fetchPetsAndRequests(true);
        }
        setIsFilterModalOpen(false);
        setCurrentPetIndex(0);
    };

    const handleDetectLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    setIsSelectingSuggestion(true);
                    setLocationSearch("Locating...");
                    let city = "Current Location";
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
                        const data = await res.json();
                        city = data.address?.city || data.address?.town || data.address?.village || data.address?.state_district || "Current Location";
                        setLocationSearch(city);
                    } catch {
                        setLocationSearch(city);
                    }
                    setTimeout(() => setIsSelectingSuggestion(false), 800);
                },
                () => {
                    alert('Unable to retrieve your location. Please search manually.');
                }
            );
        } else {
            alert('Geolocation is not supported by your browser');
        }
    };

    const handleSearchLocation = async (e) => {
        e.preventDefault();
        setShowSuggestions(false);
        if (!locationSearch.trim()) return;
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationSearch)}&countrycodes=in`);
            const data = await res.json();
            if (data && data.length > 0) {
                const { lat, lon, display_name } = data[0];
                setLocationSearch(display_name);
                setLocation(parseFloat(lat), parseFloat(lon), display_name);
                fetchPetsAndRequests(true);
            } else {
                alert('Location not found. Try a different search.');
            }
        } catch {
            alert('Error searching location.');
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setIsSelectingSuggestion(true);
        setLocationSearch(suggestion.display_name);
        setShowSuggestions(false);
        setSuggestions([]);
        
        // Reset typing flag after a short delay so manual edits work again
        setTimeout(() => setIsSelectingSuggestion(false), 800);
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        invalidateCache();
        await fetchPetsAndRequests();
        setIsRefreshing(false);
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
            <PullToRefresh onRefresh={handleRefresh} pullingContent="" >
                <div className="adopt-page">
                    <div className="adopt-toolbar">
                        <div className="toolbar-left">
                            <button
                                className="btn-filter"
                                onClick={() => setIsFilterModalOpen(true)}
                            >
                                Filters
                            </button>
                        </div>
                        <div className="location-search-container search-wrapper">
                            <form onSubmit={handleSearchLocation} className="location-search-form">
                                <input 
                                    type="text" 
                                    placeholder="Enter city or zip..." 
                                    value={locationSearch}
                                    onChange={(e) => {
                                        setLocationSearch(e.target.value);
                                        if (isSelectingSuggestion) setIsSelectingSuggestion(false);
                                    }}
                                    onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    className="location-input"
                                />
                                <button type="submit" className="btn-search" aria-label="Search">
                                    <Search size={18} />
                                </button>
                            </form>
                            <button type="button" onClick={handleDetectLocation} className="btn-detect" title="Use Current Location">
                                <LocateFixed size={18} />
                            </button>

                            {showSuggestions && suggestions.length > 0 && (
                                <ul className="suggestions-dropdown">
                                    {suggestions.map((sugg, index) => (
                                        <li 
                                            key={index} 
                                            className="suggestion-item"
                                            onMouseDown={() => handleSuggestionClick(sugg)}
                                        >
                                            {sugg.display_name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div></div>
                    </div>
                    <div className="adopt-action-header">
                        <button
                            className="refresh-btn-common desktop-only-refresh"
                            onClick={handleRefresh}
                            disabled={loading || isRefreshing}
                        >
                            {isRefreshing ? (
                                <><span className="icon-spin">↻</span> Refreshing...</>
                            ) : (
                                '↻ Refresh'
                            )}
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
                </div>
            </PullToRefresh>

                <FilterModal
                    isOpen={isFilterModalOpen}
                    onClose={() => setIsFilterModalOpen(false)}
                    onApply={handleApplyFilters}
                    currentFilters={filters}
                />
        </>
    );
}

export default Adopt;
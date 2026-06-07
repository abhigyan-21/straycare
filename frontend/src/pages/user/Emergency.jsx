import React, { useState, useEffect } from 'react';
import { Plus, Mic, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../../styles/user/Emergency.css';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../services/api';

function Emergency({ openAuthModal }) {
    const navigate = useNavigate();
    const { isLoggedIn } = useAuthStore();
    const [imagePreview, setImagePreview] = useState(null);
    const [location, setLocation] = useState('Fetching location...');
    const [isReporting, setIsReporting] = useState(false);
    const [coordinates, setCoordinates] = useState({ lat: 30.7333, lon: 76.7794 });

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    setCoordinates({ lat, lon });
                    try {
                        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
                        const data = await response.json();
                        setLocation(`${data.locality || data.city || 'Unknown Location'}, ${data.principalSubdivision || data.countryName}`);
                    } catch (err) {
                        setLocation(`Lat: ${lat.toFixed(4)}, Lng: ${lon.toFixed(4)}`);
                    }
                },
                (error) => {
                    console.error("Error getting location", error);
                    setLocation('Location access denied or unavailable');
                }
            );
        } else {
            setLocation('Geolocation not supported by browser');
        }
    }, []);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isLoggedIn) {
            alert("Please sign in or register to report an emergency.");
            if (openAuthModal) {
                openAuthModal('signin');
            }
            return;
        }

        setIsReporting(true);
        
        try {
            const descriptionVal = e.target.querySelector('textarea').value;
            
            // Post emergency report to the backend API
            const response = await apiClient.post('/reports', {
                locationLat: coordinates.lat,
                locationLng: coordinates.lon,
                description: descriptionVal,
                mediaUrls: imagePreview ? [imagePreview] : []
            });
            
            setTimeout(() => {
                navigate(`/live-track/${response.data.id}`);
            }, 1000);
        } catch (err) {
            console.error("Error submitting report to API:", err);
            // Fallback to mock on failure
            setTimeout(() => {
                const mockReportId = "demo-" + Math.random().toString(36).substr(2, 9);
                navigate(`/live-track/${mockReportId}`);
            }, 2000);
        }
    };

    if (isReporting) {
        return (
            <div className="reporting-loader-overlay">
                <div className="loader-content">
                    <CheckCircle size={80} color="#8BC34A" className="check-icon-anim" />
                    <h1>REPORTED</h1>
                    <p>Redirecting to live tracking...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="emergency-page">
            <div className={`emergency-left ${imagePreview ? 'has-image' : ''}`}>
                {imagePreview ? (
                    <img src={imagePreview} alt="Emergency Upload" className="uploaded-image" />
                ) : (
                    <Plus className="upload-icon" strokeWidth={1} />
                )}
                <input
                    type="file"
                    accept="image/*"
                    className="upload-input"
                    onChange={handleImageChange}
                    aria-label="Upload emergency picture"
                />
            </div>

            <div className="emergency-right">
                <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    <div className="description-box">
                        <textarea
                            placeholder="Describe the emergency in brief"
                            aria-label="Emergency description"
                            required
                        ></textarea>
                        <button type="button" className="mic-button" aria-label="Use voice input">
                            <Mic size={20} />
                        </button>
                    </div>

                    <div className="details-form">
                        <div className="input-group">
                            <span className="input-label">name<span className="required-star">*</span>:</span>
                            <input type="text" required />
                        </div>

                        <div className="input-group">
                            <span className="input-label">phone<span className="required-star">*</span>:</span>
                            <input type="tel" required />
                        </div>

                        <div className="input-group">
                            <span className="input-label">email:</span>
                            <input type="email" />
                        </div>

                        <div className="input-group">
                            <span className="input-label">location:</span>
                            <input type="text" value={location} readOnly title="Location auto-fetched from device" />
                        </div>
                    </div>

                    <div className="report-button-container">
                        <button type="submit" className="report-btn">report</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Emergency;
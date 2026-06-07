import React, { useState, useEffect } from 'react';
import { Plus, Mic, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../../styles/user/Emergency.css';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../services/api';

function Emergency({ openAuthModal }) {
    const navigate = useNavigate();
    const { isLoggedIn, user } = useAuthStore();
    const [imagePreview, setImagePreview] = useState(null);
    const [location, setLocation] = useState('Fetching location...');
    const [isReporting, setIsReporting] = useState(false);
    const [coordinates, setCoordinates] = useState({ lat: 30.7333, lon: 76.7794 });

    // Reporter detail states for autofill
    const [reporterName, setReporterName] = useState('');
    const [reporterPhone, setReporterPhone] = useState('');
    const [reporterEmail, setReporterEmail] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (isLoggedIn && user) {
            setReporterName(user.name || '');
            setReporterPhone(user.phone || user.contact || '');
            setReporterEmail(user.email || '');
        }
    }, [isLoggedIn, user]);

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
        setErrorMessage('');

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
            setErrorMessage("Could not report, please try again.");
            setIsReporting(false);
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
                    {errorMessage && (
                        <div className="emergency-error-message" style={{ color: '#e74c3c', padding: '12px 16px', background: '#fdf2f2', border: '1px solid #fde2e2', borderRadius: '12px', fontWeight: '600', textAlign: 'center', fontSize: '0.95rem' }}>
                            ⚠️ {errorMessage}
                        </div>
                    )}
                    <div className="description-box">
                        <textarea
                            placeholder="Describe the emergency in brief"
                            aria-label="Emergency description"
                            required
                        ></textarea>
                    </div>

                    <div className="details-form">
                        <div className="input-group">
                            <span className="input-label">name<span className="required-star">*</span>:</span>
                            <input 
                                type="text" 
                                required 
                                value={reporterName} 
                                onChange={(e) => setReporterName(e.target.value)} 
                            />
                        </div>

                        <div className="input-group">
                            <span className="input-label">phone<span className="required-star">*</span>:</span>
                            <input 
                                type="tel" 
                                required 
                                maxLength="10" 
                                value={reporterPhone} 
                                onChange={(e) => setReporterPhone(e.target.value)} 
                            />
                        </div>

                        <div className="input-group">
                            <span className="input-label">email:</span>
                            <input 
                                type="email" 
                                value={reporterEmail} 
                                onChange={(e) => setReporterEmail(e.target.value)} 
                            />
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
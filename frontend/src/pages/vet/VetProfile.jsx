import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
    User, 
    Building2, 
    Stethoscope, 
    Clock, 
    Award, 
    Settings, 
    LogOut, 
    Phone, 
    Mail, 
    MapPin, 
    ShieldCheck, 
    Calendar,
    ChevronRight,
    FileText,
    Activity,
    Plus,
    Trash2,
    Upload
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useAuthStore } from '../../store/authStore';
import '../../styles/vet/VetProfile.css';
import { getProfile, getUserDocuments, uploadUserDocument, deleteUserDocument } from '../../services/api';
import ActionLoader from '../../components/ActionLoader';
import hospitalImg from '../../assets/images/Hospital.png';

const circularLocationIcon = new L.DivIcon({ 
    className: 'custom-circular-marker',
    html: `<div style="width: 16px; height: 16px; background-color: #346c02; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 0 8px rgba(0,0,0,0.45); position: relative;"><div class="marker-pulse-ring"></div></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

function MapEventsHandler({ onMapClick, center }) {
    const map = useMapEvents({
        click(e) {
            onMapClick(e.latlng.lat, e.latlng.lng);
        }
    });

    React.useEffect(() => {
        if (center) {
            map.flyTo(center, 15);
        }
    }, [center, map]);

    return null;
}

const VetProfile = () => {
    const { user: authUser, logout, updateProfileAction, changePasswordAction } = useAuthStore();
    const [activeTab, setActiveTab] = useState('clinic');
    const [vetData, setVetData] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [documents, setDocuments] = useState([]);
    
    // Upload document states
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadForm, setUploadForm] = useState({ name: '', fileData: '', fileName: '' });
    const [isUploadingDoc, setIsUploadingDoc] = useState(false);

    // Avatar ref
    const avatarInputRef = useRef(null);

    // Profile update states
    const [nameVal, setNameVal] = useState('');
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    // Password change states
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [settingsSuccess, setSettingsSuccess] = useState('');
    const [settingsError, setSettingsError] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const [profileData, docsData] = await Promise.all([
                    getProfile(),
                    getUserDocuments()
                ]);

                setVetData({
                    name: profileData.user.name,
                    email: profileData.user.email,
                    phone: profileData.user.contact || profileData.user.phone || 'N/A',
                    role: profileData.user.role,
                    avatar: profileData.user.avatarUrl || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=400&auto=format&fit=crop',
                    clinicName: profileData.user.clinic?.name || 'StrayCare Partner',
                    licenseNo: profileData.registrationDetails?.registrationNumber || 'N/A',
                    joined: new Date(profileData.user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
                    location: profileData.user.clinic?.address || 'N/A',
                    specialization: 'General Veterinary Care',
                    experience: 'N/A',
                    experienceFull: 'Board certified veterinary clinic staff.',
                    totalRescues: profileData.stats?.totalRescues || 0,
                    activeCampaigns: profileData.stats?.activeCampaigns || 0,
                    successfulAdoptions: profileData.stats?.successfulAdoptions || 0,
                    lat: profileData.user.clinic?.lat || null,
                    lng: profileData.user.clinic?.lng || null
                });

                // Filter out registration document since we display registration details on main tab
                const filteredDocs = (docsData || []).filter(d => d.type !== 'REGISTRATION');
                setDocuments(filteredDocs);
            } catch (err) {
                console.error('Failed to load live profile, using mock:', err);
                setVetData({
                    name: authUser?.name || 'Dr. Arjun Mehta',
                    email: authUser?.email || 'contact@healthypaws.com',
                    phone: '+91 98765 43210',
                    role: authUser?.role || 'clinic',
                    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=400&auto=format&fit=crop',
                    clinicName: 'Healthy Paws Veterinary Clinic',
                    licenseNo: 'VET-MH-2026-8842',
                    joined: 'October 2025',
                    location: 'Sector 45, Gurgaon, Haryana - 122003',
                    specialization: 'Small Animal Surgery, Preventive Medicine',
                    experience: '12 Years',
                    experienceFull: 'Over a decade of experience in domestic animal care and surgical procedures.',
                    totalRescues: 142,
                    activeCampaigns: 2,
                    successfulAdoptions: 89,
                    lat: 30.7333,
                    lng: 76.7794
                });
                setDocuments([]);
            } finally {
                setLoadingProfile(false);
            }
        };

        fetchProfile();
    }, [authUser]);

    // Clinic coordinates update states
    const [clinicLatVal, setClinicLatVal] = useState(null);
    const [clinicLngVal, setClinicLngVal] = useState(null);
    const [profileMapCenter, setProfileMapCenter] = useState([30.7333, 76.7794]);
    const [isSavingLocation, setIsSavingLocation] = useState(false);

    useEffect(() => {
        if (vetData) {
            setNameVal(vetData.name);
            setClinicLatVal(vetData.lat);
            setClinicLngVal(vetData.lng);
            if (vetData.lat && vetData.lng) {
                setProfileMapCenter([vetData.lat, vetData.lng]);
            }
        }
    }, [vetData]);

    const operatingHours = [
        { day: 'Monday - Friday', time: '09:00 AM - 08:00 PM' },
        { day: 'Saturday', time: '10:00 AM - 06:00 PM' },
        { day: 'Sunday', time: 'Emergency Only' }
    ];

    const handleLogout = () => {
        logout();
        window.location.href = '/';
    };

    const handleAvatarClick = () => {
        avatarInputRef.current.click();
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64Image = reader.result;
                try {
                    await updateProfileAction(undefined, undefined, undefined, base64Image);
                    setVetData(prev => ({ ...prev, avatar: base64Image }));
                    alert('Profile picture updated successfully!');
                } catch (err) {
                    alert(err.message || 'Failed to update profile picture');
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProfileUpdateSubmit = async (e) => {
        e.preventDefault();
        setSettingsSuccess('');
        setSettingsError('');

        if (!nameVal.trim()) {
            setSettingsError('Name cannot be empty.');
            return;
        }

        setIsUpdatingProfile(true);
        try {
            await updateProfileAction(nameVal.trim());
            setVetData(prev => ({ ...prev, name: nameVal.trim() }));
            setSettingsSuccess('Profile details updated successfully!');
        } catch (err) {
            setSettingsError(err.message || 'Failed to update profile details.');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handlePasswordChangeSubmit = async (e) => {
        e.preventDefault();
        setSettingsSuccess('');
        setSettingsError('');

        if (newPassword !== confirmPassword) {
            setSettingsError('New passwords do not match.');
            return;
        }

        if (newPassword.length < 8) {
            setSettingsError('Password must be at least 8 characters long.');
            return;
        }

        setIsUpdatingPassword(true);
        try {
            const res = await changePasswordAction(currentPassword, newPassword);
            if (res.success) {
                setSettingsSuccess('Password changed successfully!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setSettingsError(res.message || 'Failed to change password.');
            }
        } catch (err) {
            setSettingsError(err.message || 'Failed to change password. Please check your current password.');
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const handleViewDocument = (doc) => {
        if (!doc.fileData) return;
        try {
            const newTab = window.open();
            if (newTab) {
                newTab.document.write(
                    `<iframe src="${doc.fileData}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
                );
                newTab.document.title = doc.name;
            } else {
                alert('Pop-up blocker is enabled. Please allow pop-ups for this site.');
            }
        } catch (e) {
            console.error('Failed to view document:', e);
            alert('Unable to open document preview.');
        }
    };

    const handleDeleteDocument = async (id) => {
        if (!window.confirm('Are you sure you want to delete this certificate?')) {
            return;
        }
        try {
            await deleteUserDocument(id);
            setDocuments(prev => prev.filter(d => d.id !== id));
            alert('Certificate deleted successfully');
        } catch (error) {
            console.error('Failed to delete document:', error);
            alert('Failed to delete document');
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.type !== 'application/pdf') {
            alert('Please select a valid PDF file.');
            e.target.value = null;
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setUploadForm(prev => ({
                ...prev,
                fileData: reader.result,
                fileName: file.name
            }));
        };
        reader.readAsDataURL(file);
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!uploadForm.fileData) {
            alert('Please select a PDF file first.');
            return;
        }
        setIsUploadingDoc(true);
        try {
            const data = await uploadUserDocument({
                name: uploadForm.name,
                type: 'Certificate',
                fileData: uploadForm.fileData
            });
            setDocuments(prev => [data, ...prev]);
            setIsUploadModalOpen(false);
            setUploadForm({ name: '', fileData: '', fileName: '' });
            alert('Document uploaded successfully!');
        } catch (error) {
            console.error('Failed to upload document:', error);
            alert('Failed to upload document');
        } finally {
            setIsUploadingDoc(false);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'clinic':
                return (
                    <div className="profile-section fade-in">
                        <h2><Building2 size={28} /> Clinic Information</h2>
                        
                        <div className="stats-row">
                            <div className="mini-stat-card">
                                <span className="stat-value">{vetData.totalRescues}</span>
                                <span className="stat-label">Total Rescues</span>
                            </div>
                            <div className="mini-stat-card">
                                <span className="stat-value">{vetData.successfulAdoptions}</span>
                                <span className="stat-label">Adoptions</span>
                            </div>
                            <div className="mini-stat-card">
                                <span className="stat-value">{vetData.activeCampaigns}</span>
                                <span className="stat-label">Active Campaigns</span>
                            </div>
                        </div>

                        <div className="details-grid">
                            <div className="detail-item">
                                <span className="label">Clinic Name</span>
                                <span className="value">{vetData.clinicName}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">License Number</span>
                                <span className="value">{vetData.licenseNo}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Primary Contact</span>
                                <span className="value">{vetData.phone}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Official Email</span>
                                <span className="value">{vetData.email}</span>
                            </div>
                            <div className="detail-item full-width">
                                <span className="label">Complete Address</span>
                                <span className="value">{vetData.location}</span>
                            </div>
                        </div>
                    </div>
                );

            case 'services':
                return (
                    <div className="profile-section fade-in">
                        <h2><Clock size={28} /> Operating Hours</h2>
                        <div className="hours-list">
                            {operatingHours.map((h, i) => (
                                <div key={i} className="hour-row">
                                    <span className="day">{h.day}</span>
                                    <span className="time">{h.time}</span>
                                </div>
                            ))}
                        </div>
                        <p style={{ marginTop: '30px', color: '#888', fontSize: '0.9rem' }}>
                            * Emergency hours are handled by the on-call medical team.
                        </p>
                    </div>
                );

            case 'certs':
                return (
                    <div className="profile-section fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2><Award size={28} /> Certifications & Documents</h2>
                            <button className="btn" onClick={() => setIsUploadModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffd21e', color: '#000', fontWeight: 'bold' }}>
                                <Plus size={18} /> Add Document
                            </button>
                        </div>
                        <div className="doc-list">
                            {documents.map(doc => (
                                <div key={doc.id} className="doc-card" style={{ cursor: 'pointer' }} onClick={() => handleViewDocument(doc)}>
                                    <div className="doc-icon"><ShieldCheck size={20} /></div>
                                    <div className="doc-info">
                                        <h4>{doc.name}</h4>
                                        <span>{doc.type} • Uploaded {new Date(doc.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteDocument(doc.id);
                                        }}
                                        style={{ 
                                            background: 'transparent', 
                                            border: 'none', 
                                            color: '#ff4d4d', 
                                            cursor: 'pointer',
                                            marginLeft: 'auto',
                                            padding: '8px'
                                        }}
                                        title="Delete Certificate"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                            {documents.length === 0 && (
                                <p style={{ color: '#888', fontStyle: 'italic', textAlign: 'center', marginTop: '20px', width: '100%' }}>
                                    No custom certifications uploaded yet.
                                </p>
                            )}
                        </div>
                    </div>
                );

            case 'settings':
                return (
                    <div className="profile-section fade-in">
                        <h2><Settings size={28} /> Account Settings</h2>
                        
                        {settingsSuccess && (
                            <div style={{ background: '#eafaf1', border: '1px solid #d1f2de', color: '#27ae60', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                {settingsSuccess}
                            </div>
                        )}
                        {settingsError && (
                            <div style={{ background: '#fdf2f2', border: '1px solid #fde2e2', color: '#e74c3c', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                {settingsError}
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                            {/* Profile Info Form */}
                            <div>
                                <h3 style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '8px', fontSize: '1.2rem', color: '#1a1a1a', fontWeight: 'bold' }}>Personal Information</h3>
                                <form onSubmit={handleProfileUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        <label style={{ fontWeight: '600', color: '#333' }}>Your Name</label>
                                        <input 
                                            type="text" 
                                            required 
                                            value={nameVal}
                                            onChange={(e) => setNameVal(e.target.value)}
                                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', background: '#fff', color: '#000' }}
                                        />
                                    </div>
                                    <button className="btn" type="submit" style={{ background: '#1a1a1a', color: '#fff', fontWeight: 'bold', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', alignSelf: 'flex-start' }} disabled={isUpdatingProfile}>
                                        {isUpdatingProfile ? 'Updating...' : 'Save Profile Details'}
                                    </button>
                                </form>
                            </div>

                            {/* Password Form */}
                            <div>
                                <h3 style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '8px', fontSize: '1.2rem', color: '#1a1a1a', fontWeight: 'bold' }}>Security Credentials</h3>
                                <form onSubmit={handlePasswordChangeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        <label style={{ fontWeight: '600', color: '#333' }}>Current Password</label>
                                        <input 
                                            type="password" 
                                            required 
                                            placeholder="••••••••" 
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', background: '#fff', color: '#000' }}
                                        />
                                    </div>
                                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        <label style={{ fontWeight: '600', color: '#333' }}>New Password</label>
                                        <input 
                                            type="password" 
                                            required 
                                            placeholder="••••••••" 
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', background: '#fff', color: '#000' }}
                                        />
                                    </div>
                                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        <label style={{ fontWeight: '600', color: '#333' }}>Confirm New Password</label>
                                        <input 
                                            type="password" 
                                            required 
                                            placeholder="••••••••" 
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', background: '#fff', color: '#000' }}
                                        />
                                    </div>
                                    <button className="btn" type="submit" style={{ background: '#1a1a1a', color: '#fff', fontWeight: 'bold', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', alignSelf: 'flex-start' }} disabled={isUpdatingPassword}>
                                        {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {(vetData.role === 'VET' || vetData.role === 'NGO') && (
                            <div className="center-coordinates-section">
                                <h3>
                                    <MapPin size={22} color="#346c02" /> Center Location Coordinates
                                </h3>
                                <p>
                                    Pin the exact location of your center so that rescuers can navigate to it for emergency pick-ups and transfers.
                                </p>
                                
                                <div className="coordinates-grid">
                                    {/* Map Container */}
                                    <div className="profile-map-wrapper">
                                        <MapContainer 
                                            center={profileMapCenter} 
                                            zoom={14} 
                                            scrollWheelZoom={false}
                                            className="leaflet-container-element"
                                        >
                                            <TileLayer
                                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            />
                                            {clinicLatVal && clinicLngVal && (
                                                <Marker 
                                                    position={[clinicLatVal, clinicLngVal]} 
                                                    icon={circularLocationIcon}
                                                    draggable={true}
                                                    eventHandlers={{
                                                        dragend: (e) => {
                                                            const marker = e.target;
                                                            const position = marker.getLatLng();
                                                            setClinicLatVal(position.lat);
                                                            setClinicLngVal(position.lng);
                                                        }
                                                    }}
                                                />
                                            )}
                                            <MapEventsHandler 
                                                onMapClick={(lat, lng) => {
                                                    setClinicLatVal(lat);
                                                    setClinicLngVal(lng);
                                                }}
                                                center={profileMapCenter}
                                            />
                                        </MapContainer>
                                    </div>
                                    
                                    {/* Coordinates & Actions */}
                                    <div className="coordinates-actions-card">
                                        <div>
                                            <div className="coordinate-field-group">
                                                <label>Latitude</label>
                                                <div className="coordinate-value-box">
                                                    {clinicLatVal ? clinicLatVal.toFixed(6) : 'Not Set'}
                                                </div>
                                            </div>
                                            <div className="coordinate-field-group last">
                                                <label>Longitude</label>
                                                <div className="coordinate-value-box">
                                                    {clinicLngVal ? clinicLngVal.toFixed(6) : 'Not Set'}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="coordinates-buttons">
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    if (!("geolocation" in navigator)) {
                                                        alert("Geolocation is not supported by your browser");
                                                        return;
                                                    }
                                                    navigator.geolocation.getCurrentPosition(
                                                        (position) => {
                                                            const { latitude, longitude } = position.coords;
                                                            setClinicLatVal(latitude);
                                                            setClinicLngVal(longitude);
                                                            setProfileMapCenter([latitude, longitude]);
                                                        },
                                                        (error) => {
                                                            alert("Failed to detect current location. Please pick it manually on the map.");
                                                        }
                                                    );
                                                }}
                                                className="btn-detect-coords"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="7"></circle>
                                                    <line x1="12" x2="12" y1="1" y2="5"></line>
                                                    <line x1="12" x2="12" y1="19" y2="23"></line>
                                                    <line x1="1" x2="5" y1="12" y2="12"></line>
                                                    <line x1="19" x2="23" y1="12" y2="12"></line>
                                                </svg>
                                                Detect My Current Location
                                            </button>
                                            
                                            <button 
                                                type="button" 
                                                onClick={async () => {
                                                    setSettingsSuccess('');
                                                    setSettingsError('');
                                                    if (!clinicLatVal || !clinicLngVal) {
                                                        setSettingsError('Please pin a location on the map first.');
                                                        return;
                                                    }
                                                    setIsSavingLocation(true);
                                                    try {
                                                        const res = await updateProfileAction(undefined, undefined, undefined, undefined, clinicLatVal, clinicLngVal);
                                                        if (res.success) {
                                                            setVetData(prev => ({
                                                                ...prev,
                                                                lat: clinicLatVal,
                                                                lng: clinicLngVal
                                                            }));
                                                            setSettingsSuccess('Center location coordinates saved successfully!');
                                                        }
                                                    } catch (err) {
                                                        setSettingsError(err.message || 'Failed to update center location.');
                                                    } finally {
                                                        setIsSavingLocation(false);
                                                    }
                                                }}
                                                disabled={isSavingLocation}
                                                className="btn-save-coords"
                                            >
                                                {isSavingLocation ? 'Saving Location...' : 'Save Location Details'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    if (loadingProfile || !vetData) {
        return <ActionLoader message="Loading profile..." />;
    }

    return (
        <>
        <Helmet>
            <title>Furzo Vet Portal - Profile</title>
            <meta name="description" content="Manage your clinic's profile, certifications, settings, and center coordinates on the Furzo Vet Portal." />
        </Helmet>
        <div className="vet-profile-page">
            <div className="profile-container">
                {/* Sidebar */}
                <div className="profile-sidebar">
                    <div className="user-info-header">
                        <div className="avatar-container" onClick={handleAvatarClick} title="Click to upload custom profile picture" style={{ cursor: 'pointer', position: 'relative' }}>
                            <img src={vetData.avatar} alt="Vet Avatar" className="avatar" />
                            <div className="avatar-overlay" style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                borderRadius: '50%',
                                background: 'rgba(0, 0, 0, 0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0,
                                transition: 'opacity 0.2s'
                            }}>
                                <span style={{ color: '#fff', fontSize: '1.2rem' }}>📷</span>
                            </div>
                            <input
                                type="file"
                                ref={avatarInputRef}
                                onChange={handleAvatarChange}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                            <span className="role-badge" style={{ pointerEvents: 'none' }}>{vetData.role}</span>
                        </div>
                        <h2 className="user-name">{vetData.name}</h2>
                        <p className="user-email">{vetData.email}</p>
                    </div>

                    <nav className="profile-nav">
                        <button 
                            className={`nav-btn ${activeTab === 'clinic' ? 'active' : ''}`}
                            onClick={() => setActiveTab('clinic')}
                        >
                            <Building2 size={20} /> Clinic Details
                        </button>
                        <button 
                            className={`nav-btn ${activeTab === 'certs' ? 'active' : ''}`}
                            onClick={() => setActiveTab('certs')}
                        >
                            <Award size={20} /> Certifications
                        </button>
                        <button 
                            className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('settings')}
                        >
                            <Settings size={20} /> Settings
                        </button>
                    </nav>
                </div>

                {/* Main Content Area */}
                <div className="profile-content">
                    {renderContent()}
                </div>
            </div>

            {/* Document Upload Modal */}
            {isUploadModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#000', marginBottom: '15px' }}>
                            <Upload size={24} /> Upload PDF Document
                        </h2>
                        <form onSubmit={handleUploadSubmit}>
                            <div className="form-group" style={{ marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <label style={{ fontWeight: '600', color: '#333', fontSize: '0.9rem' }}>Document Name</label>
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="e.g. Advanced Surgical License" 
                                    value={uploadForm.name} 
                                    onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', background: '#fff', color: '#000' }}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <label style={{ fontWeight: '600', color: '#333', fontSize: '0.9rem' }}>Select PDF File</label>
                                <input 
                                    type="file" 
                                    accept="application/pdf"
                                    required 
                                    onChange={handleFileChange}
                                    style={{ padding: '8px 0', color: '#333' }}
                                />
                                {uploadForm.fileName && (
                                    <span style={{ fontSize: '0.8rem', color: '#666' }}>Selected: {uploadForm.fileName}</span>
                                )}
                            </div>
                            <div className="modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button type="submit" className="confirm-btn" style={{ background: '#ffd21e', color: '#000', fontWeight: 'bold', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer' }} disabled={isUploadingDoc}>
                                    {isUploadingDoc ? 'Uploading...' : 'Upload'}
                                </button>
                                <button type="button" className="cancel-btn" style={{ background: '#f5f5f5', color: '#333', border: '1px solid #ccc', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer' }} onClick={() => {
                                    setIsUploadModalOpen(false);
                                    setUploadForm({ name: '', fileData: '', fileName: '' });
                                }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
        </>
    );
};

export default VetProfile;

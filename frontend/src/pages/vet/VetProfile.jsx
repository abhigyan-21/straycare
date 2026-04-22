import React, { useState } from 'react';
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
    Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/VetProfile.css';

const VetProfile = () => {
    const { user: authUser, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('clinic');

    // Mock data for vet profile
    const [vetData] = useState({
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
        successfulAdoptions: 89
    });

    const operatingHours = [
        { day: 'Monday - Friday', time: '09:00 AM - 08:00 PM' },
        { day: 'Saturday', time: '10:00 AM - 06:00 PM' },
        { day: 'Sunday', time: 'Emergency Only' }
    ];

    const certifications = [
        { id: 1, name: 'State Veterinary Council License', type: 'Required', date: '2026' },
        { id: 2, name: 'Advanced Surgical Certification', type: 'Academic', date: '2024' },
        { id: 3, name: 'StrayCare Verified Partner', type: 'Partnership', date: '2025' }
    ];

    const handleLogout = () => {
        logout();
        window.location.href = '/';
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
                        <h2><Award size={28} /> Certifications</h2>
                        <div className="doc-list">
                            {certifications.map(cert => (
                                <div key={cert.id} className="doc-card">
                                    <div className="doc-icon"><ShieldCheck size={20} /></div>
                                    <div className="doc-info">
                                        <h4>{cert.name}</h4>
                                        <span>{cert.type} • Verified {cert.date}</span>
                                    </div>
                                    <ChevronRight size={18} style={{ marginLeft: 'auto', color: '#ccc' }} />
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'settings':
                return (
                    <div className="profile-section fade-in">
                        <h2><Settings size={28} /> Account Settings</h2>
                        <div className="details-grid">
                            <div className="detail-item full-width">
                                <span className="label">Two-Factor Authentication</span>
                                <span className="value" style={{ color: '#4CAF50' }}>Enabled</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Password</span>
                                <span className="value">********</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Notification Preferences</span>
                                <span className="value">Email & SMS</span>
                            </div>
                        </div>
                        <button className="btn" style={{ marginTop: '30px', background: '#1a1a1a', color: '#fff' }}>
                            Update Security Settings
                        </button>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="vet-profile-page">
            <div className="profile-container">
                {/* Sidebar */}
                <div className="profile-sidebar">
                    <div className="user-info-header">
                        <div className="avatar-container">
                            <img src={vetData.avatar} alt="Vet Avatar" className="avatar" />
                            <span className="role-badge">{vetData.role}</span>
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
        </div>
    );
};

export default VetProfile;

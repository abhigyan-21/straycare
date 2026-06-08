import React from 'react';
import { X, Calendar, MapPin, Info, User, Building, Clock } from 'lucide-react';

const UserCampaignDetailModal = ({ campaign, onClose, onDonate }) => {
    if (!campaign) return null;

    const progress = campaign.goalAmount > 0
        ? Math.min((campaign.raisedAmount / campaign.goalAmount) * 100, 100)
        : 0;

    const theme = campaign.theme || 'blue';
    const defaultBanners = {
        blue: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=1600&auto=format&fit=crop',
        green: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?q=80&w=1600&auto=format&fit=crop',
        yellow: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1600&auto=format&fit=crop'
    };
    const bannerUrl = campaign.banner || campaign.image || defaultBanners[theme] || defaultBanners.blue;

    return (
        <div className="help-modal-overlay">
            <div className="help-modal-backdrop" onClick={onClose}></div>
            <div className="user-detail-modal-card">
                <div className="detail-banner-section">
                    <button className="close-details-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                    <img src={bannerUrl} alt={campaign.title} className="detail-banner-img" />
                    <div className="detail-banner-overlay">
                        <h2>{campaign.title}</h2>
                    </div>
                </div>

                <div className="detail-body-grid">
                    <div className="detail-main-content">
                        {/* Organizer Section */}
                        <section className="detail-section organisers-info">
                            <h3><User size={18} /> Organizer Details</h3>
                            <div className="organiser-fields">
                                <div className="organiser-field">
                                    <User className="field-icon" size={16} />
                                    <div>
                                        <label>Campaign Creator</label>
                                        <span>{campaign.creator?.name || 'StrayCare Partner'}</span>
                                    </div>
                                </div>
                                <div className="organiser-field">
                                    <Building className="field-icon" size={16} />
                                    <div>
                                        <label>Associated Clinic</label>
                                        <span>{campaign.clinic?.name || 'StrayCare Central'}</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Purpose & Description */}
                        <section className="detail-section info-text-section">
                            <h3><Info size={18} /> Purpose & Goals</h3>
                            <p className="purpose-highlight">{campaign.purpose || 'Support local stray animals rescue and treatment outreach.'}</p>
                            <div className="full-description">
                                <label>Description</label>
                                <p>{campaign.description}</p>
                            </div>
                        </section>

                        {/* Logistics */}
                        <section className="detail-section logistics-info">
                            <div className="logistics-grid">
                                <div className="logistics-card">
                                    <Calendar className="log-icon" size={18} />
                                    <div>
                                        <label>Date & Time</label>
                                        <span>
                                            {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'Active'} 
                                            {campaign.startTime ? ` at ${campaign.startTime}` : ''}
                                        </span>
                                    </div>
                                </div>
                                <div className="logistics-card">
                                    <MapPin className="log-icon" size={18} />
                                    <div>
                                        <label>Event Location</label>
                                        <span>{campaign.location || 'Local StrayCare Clinic'}</span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="detail-sidebar-content">
                        <div className="detail-funding-card">
                            <h3>Funding Goal</h3>
                            
                            <div className="funding-progress-bar-bg">
                                <div className="funding-progress-bar-fill" style={{ width: `${progress}%` }}></div>
                            </div>

                            <div className="funding-stats-grid">
                                <div>
                                    <label>Raised</label>
                                    <span className="amount font-accent">₹{campaign.raisedAmount?.toLocaleString() || '0'}</span>
                                </div>
                                <div>
                                    <label>Target Goal</label>
                                    <span className="amount font-muted">₹{campaign.goalAmount?.toLocaleString() || '0'}</span>
                                </div>
                            </div>

                            <div className="funding-percentage-reached">
                                {progress.toFixed(0)}% reached
                            </div>

                            <button 
                                className="detail-donate-btn"
                                onClick={() => {
                                    onDonate(campaign);
                                }}
                            >
                                Donate Now
                            </button>
                        </div>

                        {campaign.endDate && (
                            <div className="detail-timeline-card">
                                <h3><Clock size={16} /> Campaign Timeline</h3>
                                <div className="timeline-labels">
                                    <div className="timeline-point">
                                        <span className="point-dot active"></span>
                                        <label>Started: {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'N/A'}</label>
                                    </div>
                                    <div className="timeline-point">
                                        <span className="point-dot"></span>
                                        <label>Ends: {new Date(campaign.endDate).toLocaleDateString()}</label>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserCampaignDetailModal;

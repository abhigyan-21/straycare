import React from 'react';
import { X, Calendar, MapPin, Info, User, Building, Clock, ExternalLink, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCampaignEndDate, getPartner } from '../../services/api';

const UserCampaignDetailModal = ({ campaign, onClose, onDonate }) => {
    const navigate = useNavigate();

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
    const partner = getPartner(campaign);
    const endDate = getCampaignEndDate(campaign);

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
                                        <span>{campaign.creator?.name || 'Anonymous'}</span>
                                    </div>
                                </div>
                                <div className="organiser-field">
                                    <Building className="field-icon" size={16} />
                                    <div>
                                        <label>Associated Clinic</label>
                                        <span>
                                            {partner ? (
                                                <span 
                                                    className="partner-profile-link" 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        onClose();
                                                        setTimeout(() => navigate(`/partner/${partner.id}`), 0);
                                                    }}
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#346c02', cursor: 'pointer', fontWeight: '600' }}
                                                >
                                                    {partner.name} <ExternalLink size={12} />
                                                </span>
                                            ) : (
                                                'Independent'
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Purpose & Description */}
                        <section className="detail-section info-text-section">
                            <h3><Info size={18} /> Purpose & Goals</h3>
                            {campaign.purpose && <p className="purpose-highlight">{campaign.purpose}</p>}
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
                                {campaign.location && (
                                    <div className="logistics-card">
                                        <MapPin className="log-icon" size={18} />
                                        <div>
                                            <label>Event Location</label>
                                            <span>{campaign.location}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Progress Updates Section */}
                        {campaign.progressUpdates && campaign.progressUpdates.length > 0 && (
                            <section className="detail-section progress-updates-info" style={{ marginTop: '24px' }}>
                                <h3><Activity size={18} /> Campaign Updates</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                                    {campaign.progressUpdates.map((update, index) => (
                                        <div key={index} style={{ padding: '12px', background: '#fdfdf9', borderLeft: '4px solid #346c02', borderRadius: '4px', fontSize: '0.9rem', color: '#555' }}>
                                            {update}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
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

                        {endDate && (
                            <div className="detail-timeline-card">
                                <h3><Clock size={16} /> Campaign Timeline</h3>
                                <div className="timeline-labels">
                                    <div className="timeline-point">
                                        <span className="point-dot active"></span>
                                        <label>Started: {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'N/A'}</label>
                                    </div>
                                    <div className="timeline-point">
                                        <span className="point-dot"></span>
                                        <label>Ends: {new Date(endDate).toLocaleDateString()}</label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Recent Supporters */}
                        {campaign.donations && campaign.donations.length > 0 && (
                            <div className="detail-funding-card" style={{ marginTop: '20px', background: '#fafafa', border: '1px solid #eee' }}>
                                <h3 style={{ fontSize: '1rem', borderBottom: '1px solid #eaeaea', paddingBottom: '8px', marginBottom: '12px' }}>Recent Supporters</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {campaign.donations.slice(0, 5).map((donation) => (
                                        <div key={donation.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#346c02', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                {(donation.user?.name || 'A')[0].toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1, fontSize: '0.9rem', color: '#333' }}>
                                                <strong>{donation.user?.name || 'Anonymous'}</strong>
                                                <div style={{ fontSize: '0.75rem', color: '#888' }}>
                                                    {new Date(donation.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#346c02', fontWeight: 'bold' }}>
                                                Supported
                                            </div>
                                        </div>
                                    ))}
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

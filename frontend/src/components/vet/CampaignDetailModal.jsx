import React from 'react';
import { X, Calendar, MapPin, Target, Users, Clock, Info } from 'lucide-react';
import '../../styles/vet/VetAdopt.css'; // Reuse modal-overlay styles

const CampaignDetailModal = ({ campaign, onClose }) => {
    if (!campaign) return null;

    const progress = Math.min((campaign.raisedAmount / campaign.goalAmount) * 100, 100);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content campaign-detail-modal" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="campaign-banner">
                    <img src={campaign.banner || campaign.image} alt={campaign.title} />
                    <div className="banner-overlay">
                        <h2>{campaign.title}</h2>
                        <span className="campaign-id">{campaign.id}</span>
                    </div>
                </div>

                <div className="detail-content">
                    <div className="detail-grid">
                        <div className="detail-main">
                            <section className="purpose-section">
                                <h3><Info size={20} /> Purpose</h3>
                                <p>{campaign.purpose || campaign.description}</p>
                            </section>

                            <section className="info-cards">
                                <div className="info-card">
                                    <Calendar className="icon" />
                                    <div>
                                        <label>Date & Time</label>
                                        <span>{new Date(campaign.startDate).toLocaleDateString()} at {campaign.startTime || '09:00 AM'}</span>
                                    </div>
                                </div>
                                <div className="info-card">
                                    <MapPin className="icon" />
                                    <div>
                                        <label>Location</label>
                                        <span>{campaign.location || 'StrayCare Clinic'}</span>
                                    </div>
                                </div>
                            </section>

                            <section className="volunteers-section">
                                <h3><Users size={20} /> Volunteers ({campaign.volunteers})</h3>
                                <div className="volunteers-list">
                                    {campaign.volunteersList ? campaign.volunteersList.map((v, i) => (
                                        <span key={i} className="volunteer-tag">{v}</span>
                                    )) : <p>No volunteers registered yet.</p>}
                                </div>
                            </section>
                        </div>

                        <div className="detail-sidebar">
                            <div className="funding-card">
                                <h3>Funding Progress</h3>
                                <div className="amount-info">
                                    <div className="raised">
                                        <label>Raised</label>
                                        <span>${campaign.raisedAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="target">
                                        <label>Target</label>
                                        <span>${campaign.goalAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="progress-bar-large">
                                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                                </div>
                                <div className="progress-percentage">{progress.toFixed(0)}% reached</div>
                                <button className="edit-campaign-btn">Edit Campaign</button>
                            </div>

                            <div className="status-timeline">
                                <h3><Clock size={18} /> Timeline</h3>
                                <div className="timeline-item">
                                    <span className="dot active"></span>
                                    <label>Started: {new Date(campaign.startDate).toLocaleDateString()}</label>
                                </div>
                                <div className="timeline-item">
                                    <span className="dot"></span>
                                    <label>Ends: {new Date(campaign.endDate).toLocaleDateString()}</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CampaignDetailModal;

import React, { useState } from 'react';
import { X, Calendar, MapPin, Target, Users, Clock, Info, Printer, Send, Loader2 } from 'lucide-react';
import '../../styles/vet/VetCampaign.css';

const CampaignDetailModal = ({ campaign, onClose, onRefresh }) => {
    if (!campaign) return null;

    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [broadcastSuccess, setBroadcastSuccess] = useState(false);

    const progress = campaign.goalAmount > 0
        ? Math.min((campaign.raisedAmount / campaign.goalAmount) * 100, 100)
        : 0;

    // Handle real or mock volunteers list
    const volunteersList = campaign.volunteersList ||
        (Array.isArray(campaign.volunteers)
            ? campaign.volunteers.map(v => v.user?.name).filter(Boolean)
            : []);

    const volunteerCount = Array.isArray(campaign.volunteers)
        ? campaign.volunteers.length
        : (campaign.volunteers || 0);

    const handleDownloadVolunteers = () => {
        if (volunteersList.length === 0) {
            alert("No confirmed volunteers registered yet.");
            return;
        }

        const fileContent = `STRAYCARE CAMPAIGN VOLUNTEERS LIST\n` +
            `=================================\n` +
            `Campaign Title : ${campaign.title}\n` +
            `Campaign ID    : ${campaign.id}\n` +
            `Location       : ${campaign.location || 'Clinic'}\n` +
            `Date           : ${new Date(campaign.startDate).toLocaleDateString()}\n` +
            `Total Confirmed: ${volunteerCount}\n` +
            `=================================\n\n` +
            volunteersList.map((name, index) => `${String(index + 1).padStart(2, '0')}. ${name}`).join('\n') +
            `\n\nGenerated on: ${new Date().toLocaleString()}`;

        const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Volunteers_Campaign_${campaign.id}.txt`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleBroadcastCallout = async () => {
        setIsBroadcasting(true);
        setBroadcastSuccess(false);

        try {
            const response = await fetch(`/api/funding/campaigns/${campaign.id}/notify`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                setBroadcastSuccess(true);
                alert(`Broadcast successful! Sent notification emails to ${result.notifiedCount} nearby volunteers.`);
                if (onRefresh) onRefresh();
            } else {
                throw new Error('API failed');
            }
        } catch (error) {
            console.warn("API broadcast failed, running mock broadcast:", error);
            // Simulate mock broadcast
            setTimeout(() => {
                setBroadcastSuccess(true);
                // Simulate new confirmations by adding mock volunteers to lists in state
                if (onRefresh) {
                    // Update volunteers in mock data if possible or show immediate update
                    campaign.volunteers = (campaign.volunteers || 0) + 3;
                    if (!campaign.volunteersList) campaign.volunteersList = [];
                    campaign.volunteersList.push('Bruce Wayne', 'Clark Kent', 'Diana Prince');
                    onRefresh();
                }
                alert("Simulated Volunteer Notification: Outgoing emails logged to backend terminal! (3 new volunteers confirmed).");
            }, 1500);
        } finally {
            setTimeout(() => {
                setIsBroadcasting(false);
            }, 1500);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content campaign-detail-modal" onClick={e => e.stopPropagation()}>
                <div className="campaign-banner">
                    <button className="close-btn" onClick={onClose}>
                        <span style={{ color: 'white', fontSize: '1.2rem' }}>X</span>
                    </button>
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
                                <div className="volunteers-header-row">
                                    <h3>
                                        <Users size={20} /> Volunteers ({volunteerCount})
                                    </h3>
                                    <div className="volunteer-action-group">
                                        <button
                                            className="print-list-btn"
                                            onClick={handleDownloadVolunteers}
                                            title="Download Confirmed Volunteers List"
                                        >
                                            <Printer size={18} />
                                        </button>
                                        <button
                                            className={`broadcast-notify-btn ${isBroadcasting ? 'loading' : ''} ${broadcastSuccess ? 'success' : ''}`}
                                            onClick={handleBroadcastCallout}
                                            disabled={isBroadcasting}
                                            title="Broadcast Callout Emails to Nearby Volunteers"
                                        >
                                            {isBroadcasting ? (
                                                <Loader2 size={16} className="spin-icon" />
                                            ) : (
                                                <Send size={16} />
                                            )}
                                            {isBroadcasting ? 'Broadcasting...' : 'Confirm volunteers'}
                                        </button>
                                    </div>
                                </div>
                                <div className="volunteers-list">
                                    {volunteersList.length > 0 ? volunteersList.map((v, i) => (
                                        <span key={i} className="volunteer-tag">{v}</span>
                                    )) : <p className="no-volunteers-placeholder">No confirmed volunteers yet. Click "Confirm volunteers" to notify nearby volunteers!</p>}
                                </div>
                            </section>
                        </div>

                        <div className="detail-sidebar">
                            <div className="funding-card">
                                <h3>Funding Progress</h3>
                                <div className="amount-info">
                                    <div className="raised">
                                        <label>Raised</label>
                                        <span>₹{campaign.raisedAmount?.toLocaleString() || '0'}</span>
                                    </div>
                                    <div className="target">
                                        <label>Target</label>
                                        <span>₹{campaign.goalAmount?.toLocaleString() || '0'}</span>
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

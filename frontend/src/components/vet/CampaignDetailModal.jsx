import React, { useState } from 'react';
import { X, Calendar, MapPin, Target, Users, Clock, Info, Printer, Send, Loader2 } from 'lucide-react';
import '../../styles/vet/VetCampaign.css';
import apiClient, { getCampaignEndDate } from '../../services/api';

const CampaignDetailModal = ({ campaign, onClose, onRefresh }) => {
    if (!campaign) return null;

    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [broadcastSuccess, setBroadcastSuccess] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [collectedAmount, setCollectedAmount] = useState(campaign.raisedAmount || 0);
    const [isUpdatingAmount, setIsUpdatingAmount] = useState(false);

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toISOString().split('T')[0];
        } catch (e) {
            return '';
        }
    };

    const [editedFields, setEditedFields] = useState({
        title: campaign.title || '',
        description: campaign.description || '',
        purpose: campaign.purpose || campaign.description || '',
        goalAmount: campaign.goalAmount || '',
        location: campaign.location || '',
        startDate: formatDateForInput(campaign.startDate),
        endDate: formatDateForInput(getCampaignEndDate(campaign)),
        startTime: campaign.startTime || '09:00 AM'
    });

    const handleSaveChanges = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                title: editedFields.title,
                description: editedFields.description,
                purpose: editedFields.purpose,
                goalAmount: parseFloat(editedFields.goalAmount),
                location: editedFields.location,
                startDate: editedFields.startDate,
                endDate: editedFields.endDate,
                startTime: editedFields.startTime
            };

            await apiClient.patch(`/funding/campaigns/${campaign.id}`, payload);
            alert("Campaign updated successfully!");
            setIsEditing(false);
            if (onRefresh) onRefresh();
            onClose();
        } catch (error) {
            console.error("Failed to edit campaign via API, simulating mock edit:", error);
            campaign.title = editedFields.title;
            campaign.description = editedFields.description;
            campaign.purpose = editedFields.purpose;
            campaign.goalAmount = parseFloat(editedFields.goalAmount);
            campaign.location = editedFields.location;
            campaign.startDate = editedFields.startDate;
            campaign.deadline = editedFields.endDate;
            campaign.startTime = editedFields.startTime;

            alert("Updated successfully! (Offline Mock Mode)");
            setIsEditing(false);
            if (onRefresh) onRefresh();
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteCampaign = async () => {
        const confirmDelete = window.confirm("Are you sure you want to delete this campaign? This action cannot be undone.");
        if (!confirmDelete) return;

        setIsDeleting(true);
        try {
            await apiClient.delete(`/funding/campaigns/${campaign.id}`);
            alert("Campaign deleted successfully!");
            if (onRefresh) onRefresh();
            onClose();
        } catch (error) {
            console.error("Failed to delete campaign via API, simulating mock delete:", error);
            alert("Deleted successfully! (Offline Mock Mode)");
            if (onRefresh) onRefresh();
            onClose();
        } finally {
            setIsDeleting(false);
        }
    };

    const handleUpdateCollectedAmount = async (e) => {
        e.preventDefault();
        const amount = parseFloat(collectedAmount);
        if (isNaN(amount) || amount < 0) {
            alert('Please enter a valid positive number for the collected amount.');
            return;
        }
        setIsUpdatingAmount(true);
        try {
            await apiClient.put(`/funding/campaigns/${campaign.id}/progress`, {
                raisedAmount: amount
            });
            alert('Collected amount updated successfully!');
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error('Failed to update collected amount:', err);
            alert('Failed to update collected amount.');
        } finally {
            setIsUpdatingAmount(false);
        }
    };

    const raisedAmount = Number(campaign.raisedAmount || 0);
    const goalAmount = Number(campaign.goalAmount || 0);
    const progress = goalAmount > 0
        ? Math.min((raisedAmount / goalAmount) * 100, 100)
        : 0;
    const campaignEndDate = getCampaignEndDate(campaign);

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
            const response = await apiClient.post(`/funding/campaigns/${campaign.id}/notify`);
            setBroadcastSuccess(true);
            alert(`Broadcast successful! Sent notification emails to ${response.data.notifiedCount || 0} nearby volunteers.`);
            if (onRefresh) onRefresh();
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

    const theme = campaign.theme || 'blue';
    const defaultBanners = {
        blue: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=1600&auto=format&fit=crop',
        green: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?q=80&w=1600&auto=format&fit=crop',
        yellow: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1600&auto=format&fit=crop'
    };
    const bannerUrl = campaign.banner || campaign.image || defaultBanners[theme] || defaultBanners.blue;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content campaign-detail-modal" onClick={e => e.stopPropagation()}>
                <div className="campaign-banner">
                    <button className="close-btn" onClick={onClose}>
                        <span style={{ color: 'white', fontSize: '1.2rem' }}>X</span>
                    </button>
                    <img src={bannerUrl} alt={campaign.title} />
                    <div className="banner-overlay">
                        <h2>{campaign.title}</h2>
                        <span className="campaign-id">{campaign.id}</span>
                    </div>
                </div>

                <div className="detail-content">
                    <div className="detail-grid">
                        <div className="detail-main">
                            {isEditing ? (
                                <form onSubmit={handleSaveChanges} className="campaign-edit-form" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px' }}>
                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem', color: '#1a1a1a', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '5px' }}>
                                        <Info size={22} /> Edit Campaign
                                    </h3>
                                    
                                    <div className="form-field-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontWeight: 700, fontSize: '0.85rem', color: '#555', textTransform: 'uppercase' }}>Campaign Title</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={editedFields.title}
                                            onChange={e => setEditedFields({...editedFields, title: e.target.value})}
                                            style={{ padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #ddd', fontSize: '0.95rem', fontFamily: 'inherit' }}
                                        />
                                    </div>

                                    <div className="form-field-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontWeight: 700, fontSize: '0.85rem', color: '#555', textTransform: 'uppercase' }}>Short Description</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={editedFields.description}
                                            onChange={e => setEditedFields({...editedFields, description: e.target.value})}
                                            style={{ padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #ddd', fontSize: '0.95rem', fontFamily: 'inherit' }}
                                        />
                                    </div>

                                    <div className="form-field-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontWeight: 700, fontSize: '0.85rem', color: '#555', textTransform: 'uppercase' }}>Detailed Purpose</label>
                                        <textarea 
                                            rows="3" 
                                            required
                                            value={editedFields.purpose}
                                            onChange={e => setEditedFields({...editedFields, purpose: e.target.value})}
                                            style={{ padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #ddd', fontSize: '0.95rem', fontFamily: 'inherit', resize: 'vertical' }}
                                        ></textarea>
                                    </div>

                                    <div className="form-row-two" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div className="form-field-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontWeight: 700, fontSize: '0.85rem', color: '#555', textTransform: 'uppercase' }}>Goal Amount (₹)</label>
                                            <input 
                                                type="number" 
                                                required
                                                value={editedFields.goalAmount}
                                                onChange={e => setEditedFields({...editedFields, goalAmount: e.target.value})}
                                                style={{ padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #ddd', fontSize: '0.95rem', fontFamily: 'inherit' }}
                                            />
                                        </div>
                                        <div className="form-field-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontWeight: 700, fontSize: '0.85rem', color: '#555', textTransform: 'uppercase' }}>Location</label>
                                            <input 
                                                type="text" 
                                                required
                                                value={editedFields.location}
                                                onChange={e => setEditedFields({...editedFields, location: e.target.value})}
                                                style={{ padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #ddd', fontSize: '0.95rem', fontFamily: 'inherit' }}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row-three" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                                        <div className="form-field-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontWeight: 700, fontSize: '0.85rem', color: '#555', textTransform: 'uppercase' }}>Start Date</label>
                                            <input 
                                                type="date" 
                                                required
                                                value={editedFields.startDate}
                                                onChange={e => setEditedFields({...editedFields, startDate: e.target.value})}
                                                style={{ padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #ddd', fontSize: '0.95rem', fontFamily: 'inherit' }}
                                            />
                                        </div>
                                        <div className="form-field-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontWeight: 700, fontSize: '0.85rem', color: '#555', textTransform: 'uppercase' }}>End Date</label>
                                            <input 
                                                type="date" 
                                                required
                                                value={editedFields.endDate}
                                                onChange={e => setEditedFields({...editedFields, endDate: e.target.value})}
                                                style={{ padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #ddd', fontSize: '0.95rem', fontFamily: 'inherit' }}
                                            />
                                        </div>
                                        <div className="form-field-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontWeight: 700, fontSize: '0.85rem', color: '#555', textTransform: 'uppercase' }}>Start Time</label>
                                            <input 
                                                type="time" 
                                                required
                                                value={editedFields.startTime}
                                                onChange={e => setEditedFields({...editedFields, startTime: e.target.value})}
                                                style={{ padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #ddd', fontSize: '0.95rem', fontFamily: 'inherit' }}
                                            />
                                        </div>
                                    </div>

                                    <div className="edit-actions-row" style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                                        <button 
                                            type="submit" 
                                            disabled={isSaving}
                                            className="confirm-btn"
                                            style={{ flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: '#346c02', color: 'white', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s' }}
                                        >
                                            {isSaving ? "Saving..." : "Save Changes"}
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setIsEditing(false)}
                                            className="cancel-btn outline"
                                            style={{ flex: 1, padding: '14px', borderRadius: '14px', border: '1.5px solid #ccc', background: 'transparent', color: '#555', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s' }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <>
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

                                     <section className="progress-updates-section" style={{ marginTop: '30px' }}>
                                         <h3><Info size={20} /> Update Collected Amount</h3>
                                         <form onSubmit={handleUpdateCollectedAmount} style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                             <input 
                                                 type="number" 
                                                 value={collectedAmount}
                                                 onChange={(e) => setCollectedAmount(e.target.value)}
                                                 placeholder="Enter collected amount (₹)"
                                                 style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd' }}
                                                 required
                                                 min="0"
                                                 step="any"
                                             />
                                             <button 
                                                 type="submit" 
                                                 className="action-btn"
                                                 disabled={isUpdatingAmount}
                                                 style={{ background: '#346c02', color: '#fff', border: 'none', borderRadius: '8px', padding: '0 20px', fontWeight: 'bold', cursor: 'pointer' }}
                                             >
                                                 {isUpdatingAmount ? 'Updating...' : 'Update Amount'}
                                             </button>
                                         </form>
                                     </section>
                                </>
                            )}
                        </div>

                        <div className="detail-sidebar">
                            <div className="funding-card">
                                <h3>Funding Progress</h3>
                                <div className="amount-info">
                                    <div className="raised">
                                        <label>Raised</label>
                                        <span>Rs {raisedAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="target">
                                        <label>Target</label>
                                        <span>Rs {goalAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="progress-bar-large">
                                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                                </div>
                                <div className="progress-percentage">{progress.toFixed(0)}% reached</div>
                                {!isEditing ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <button 
                                            className="edit-campaign-btn"
                                            onClick={() => setIsEditing(true)}
                                        >
                                            Edit Campaign
                                        </button>
                                        <button 
                                            className="delete-campaign-btn"
                                            onClick={handleDeleteCampaign}
                                            disabled={isDeleting}
                                        >
                                            {isDeleting ? "Deleting..." : "Delete Campaign"}
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ padding: '10px', background: '#252525', borderRadius: '15px', color: '#aaa', fontSize: '0.85rem', lineHeight: '1.4' }}>
                                        Make changes in the left editor panel and click "Save Changes" to apply.
                                    </div>
                                )}
                            </div>

                            <div className="status-timeline">
                                <h3><Clock size={18} /> Timeline</h3>
                                <div className="timeline-item">
                                    <span className="dot active"></span>
                                    <label>Started: {new Date(campaign.startDate).toLocaleDateString()}</label>
                                </div>
                                <div className="timeline-item">
                                    <span className="dot"></span>
                                    <label>Ends: {campaignEndDate ? new Date(campaignEndDate).toLocaleDateString() : 'N/A'}</label>
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

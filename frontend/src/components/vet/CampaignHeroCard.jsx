import React from 'react';
import { ChevronRight } from 'lucide-react';

const CampaignHeroCard = ({ campaign, isActive, calculateDaysLeft, onDetails }) => {
    const theme = campaign.theme || 'blue';
    const defaultImages = {
        blue: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=1200&auto=format&fit=crop',
        green: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?q=80&w=1200&auto=format&fit=crop',
        yellow: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1200&auto=format&fit=crop'
    };
    const imageUrl = campaign.image || defaultImages[theme] || defaultImages.blue;

    return (
        <div className={`campaign-active-card ${isActive ? 'active-slide' : ''}`}>
            <div className="active-status-indicator">
                <div className="pulse-dot"></div>
                <span>Active</span>
            </div>

            <div className="card-image-section">
                <img src={imageUrl} alt={campaign.title} className="card-bg-image" />
                <div className={`card-overlay ${theme}`}></div>
                <h3 style={{ position: 'relative', zIndex: 2, color: 'white', fontWeight: 800, fontSize: '1.4rem', textShadow: '0 2px 10px rgba(0,0,0,0.3)', textAlign: 'center', padding: '20px' }}>
                    {theme.toUpperCase()} DRIVE
                </h3>
            </div>
            
            <div className="card-details-section">
                <div>
                    <h3 className="card-title-horizontal">{campaign.title}</h3>
                    <div className="card-stats-row">
                        <div className="card-mini-stat">
                            <label>Volunteers</label>
                            <span>{Array.isArray(campaign.volunteers) ? campaign.volunteers.length : (campaign.volunteers || 0)}</span>
                        </div>
                        <div className="card-mini-stat">
                            <label>Raised</label>
                            <span>₹{campaign.raisedAmount.toLocaleString()}</span>
                        </div>
                        <div className="card-mini-stat">
                            <label>Goal</label>
                            <span>₹{campaign.goalAmount.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="campaign-progress-container" style={{ margin: '0 0 20px 0' }}>
                        <div className="progress-bar-bg">
                            <div 
                                className="progress-bar-fill" 
                                style={{ width: `${(campaign.raisedAmount / campaign.goalAmount) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                <div className="card-action-row">
                    <div className="mini-stat">
                        <span className="mini-stat-label">Time Remaining</span>
                        <span className="mini-stat-value" style={{ fontSize: '0.9rem' }}>{calculateDaysLeft(campaign.endDate)} Days left</span>
                    </div>
                    <button className="view-campaign-btn" onClick={() => onDetails(campaign)}>
                        View Details <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CampaignHeroCard;

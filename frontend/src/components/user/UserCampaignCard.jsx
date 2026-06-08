import React from 'react';

const UserCampaignCard = ({ campaign, category, progress, onDonate, onDetails }) => {
    const colorThemes = {
        food: 'food-theme',
        shelter: 'shelter-theme',
        treatment: 'treatment-theme',
        other: 'other-theme'
    };

    return (
        <div className={`campaign-grid-card ${colorThemes[category] || 'other-theme'}`}>
            <div className="card-image-wrapper">
                <img src={campaign.image || 'https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=800&auto=format&fit=crop'} alt={campaign.title} />
                <span className={`category-badge ${category}`}>{category.toUpperCase()}</span>
            </div>
            <div className="card-info-wrapper">
                <div className="card-header-desc-group">
                    <div>
                        <h3 className="camp-title">{campaign.title}</h3>
                        <span className="camp-creator">Created by: {campaign.creator?.name || 'StrayCare Partner'}</span>
                    </div>
                    <p className="camp-desc">{campaign.description}</p>
                </div>
                
                <div className="camp-progress-bar-container">
                    <div className="camp-progress-bar">
                        <div className="camp-progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="camp-progress-labels">
                        <span>₹{campaign.raisedAmount?.toLocaleString() || '0'} raised</span>
                        <span>Goal: ₹{campaign.goalAmount?.toLocaleString() || '0'}</span>
                    </div>
                </div>
                
                <div className="card-buttons-row">
                    <button 
                        className="card-donate-btn"
                        onClick={() => onDonate(campaign)}
                    >
                        Donate Now
                    </button>
                    <button 
                        className="card-details-btn"
                        onClick={() => onDetails(campaign)}
                    >
                        Show Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserCampaignCard;

import React from 'react';

const HighlightCard = ({ type, campaign, badgeText, contributor, onDonate, onDetails }) => {
    if (type === 'campaign') {
        if (!campaign) return null;
        
        const progress = campaign.goalAmount > 0
            ? Math.min(100, Math.round(((campaign.raisedAmount || 0) / campaign.goalAmount) * 100))
            : 0;

        return (
            <div className="highlight-card latest-campaign">
                <div className="highlight-badge">{badgeText || 'LATEST CAMPAIGN'}</div>
                <div className="highlight-content">
                    <div 
                        className="highlight-image" 
                        style={{ backgroundImage: `url(${campaign.image || 'https://images.unsplash.com/photo-1599443015574-be5fe8a05783?auto=format&fit=crop&q=80&w=800'})` }}
                    ></div>
                    <div className="highlight-details">
                        <h3>{campaign.title}</h3>
                        <p>{campaign.description}</p>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                        </div>
                        <span className="progress-text">
                            {progress}% reached (₹{(campaign.raisedAmount || 0).toLocaleString()} of ₹{campaign.goalAmount?.toLocaleString() || '0'})
                        </span>
                        <div className="campaign-actions">
                            <button 
                                className="highlight-action-btn primary" 
                                onClick={() => onDonate && onDonate(campaign)}
                            >
                                Contribute Now
                            </button>
                            <button 
                                className="highlight-action-btn secondary" 
                                onClick={() => onDetails && onDetails(campaign)}
                            >
                                Show Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (type === 'supporter') {
        // Fallback supporter data if contributor is null
        const name = contributor ? contributor.name : "Elena Gilbert";
        const avatar = contributor && contributor.avatar ? contributor.avatar : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200";
        const quote = contributor ? "Thank you for supporting our strays! Every contribution helps save a life." : "Seeing these animals find safety is the greatest reward. Every little bit counts!";
        const amountText = contributor ? `₹${contributor.totalAmount.toLocaleString()}` : "₹1,250";
        const statLabel = contributor ? "This Month's Contributions" : "Contributions";

        return (
            <div className="highlight-card top-supporter">
                <div className="highlight-badge">TOP SUPPORTER</div>
                <div className="supporter-profile">
                    <div className="supporter-avatar">
                        <img src={avatar} alt={name} />
                    </div>
                    <h3>{name}</h3>
                    <p className="supporter-quote">"{quote}"</p>
                    <div className="supporter-stat">
                        <span className="stat-label">{statLabel}</span>
                        <span className="stat-value">{amountText}</span>
                    </div>
                    <div className="supporter-badge-icon">🏆</div>
                </div>
            </div>
        );
    }

    return null;
};

export default HighlightCard;

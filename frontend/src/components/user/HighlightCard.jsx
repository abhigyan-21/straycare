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
        if (!contributor) {
            return (
                <div className="highlight-card top-supporter">
                    <div className="highlight-badge">TOP SUPPORTER</div>
                    <div className="supporter-profile" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '2rem' }}>
                        <div className="supporter-badge-icon" style={{ position: 'relative', top: 0, right: 0, fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
                        <h3 style={{ color: '#888' }}>No Contributors Yet</h3>
                        <p className="supporter-quote" style={{ textAlign: 'center' }}>"Be the first to make a difference this month!"</p>
                    </div>
                </div>
            );
        }

        const name = contributor.name || "Anonymous";
        const avatar = contributor.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(name) + "&background=random";
        const quote = "Thank you for supporting our strays! Every contribution helps save a life.";
        const amountText = `₹${(contributor.totalAmount || 0).toLocaleString()}`;
        const statLabel = "This Month's Contributions";

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

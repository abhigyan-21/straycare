import React from 'react';

const HighlightCard = ({ type, data }) => {
    if (type === 'campaign') {
        return (
            <div className="highlight-card latest-campaign">
                <div className="highlight-badge">LATEST CAMPAIGN</div>
                <div className="highlight-content">
                    <div className="highlight-image" style={{ backgroundImage: `url(${data.image})` }}></div>
                    <div className="highlight-details">
                        <h3>{data.title}</h3>
                        <p>{data.description}</p>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${data.progress}%` }}></div>
                        </div>
                        <span className="progress-text">{data.goalText}</span>
                        <div className="campaign-actions">
                            <button className="highlight-action-btn primary">{data.primaryAction}</button>
                            <button className="highlight-action-btn secondary">{data.secondaryAction}</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (type === 'supporter') {
        return (
            <div className="highlight-card top-supporter">
                <div className="highlight-badge">TOP SUPPORTER</div>
                <div className="supporter-profile">
                    <div className="supporter-avatar">
                        <img src={data.avatar} alt={data.name} />
                    </div>
                    <h3>{data.name}</h3>
                    <p className="supporter-quote">"{data.quote}"</p>
                    <div className="supporter-stat">
                        <span className="stat-label">{data.statLabel}</span>
                        <span className="stat-value">{data.statValue}</span>
                    </div>
                    <div className="supporter-badge-icon">{data.badgeIcon}</div>
                </div>
            </div>
        );
    }

    return null;
};

export default HighlightCard;

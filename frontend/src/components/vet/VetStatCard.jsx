import React from 'react';

const VetStatCard = ({ label, value, date, campaignTitle }) => {
    return (
        <div className="stat-card">
            <span className="stat-label">{label}</span>
            {date ? (
                <>
                    <div className="stat-value date">{date}</div>
                    <div className="campaign-detail">{campaignTitle}</div>
                </>
            ) : (
                <div className="stat-value">{value}</div>
            )}
        </div>
    );
};

export default VetStatCard;

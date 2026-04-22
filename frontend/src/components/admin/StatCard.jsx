import React from 'react';

const StatCard = ({ icon: Icon, title, value, colorClass, borderClass }) => {
    return (
        <div className={`admin-stat-card ${borderClass || ''}`}>
            <div className={`admin-stat-icon ${colorClass}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="admin-stat-title">{title}</p>
                <p className="admin-stat-value">{value}</p>
            </div>
        </div>
    );
};

export default StatCard;

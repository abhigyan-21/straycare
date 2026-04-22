import React from 'react';

const VetTabs = ({ tabs, activeTab, onTabChange }) => {
    return (
        <div className="adopt-tabs">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => onTabChange(tab.id)}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

export default VetTabs;

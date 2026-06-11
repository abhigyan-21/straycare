import React from 'react';
import { Users, Target, Clock, ChevronRight, Calendar } from 'lucide-react';
import { getCampaignEndDate } from '../../services/api';

const CampaignListItem = ({ campaign, calculateDaysLeft, onDetails }) => {
    const raisedAmount = Number(campaign.raisedAmount || 0);
    const goalAmount = Number(campaign.goalAmount || 0);
    const progress = goalAmount > 0 ? Math.min((raisedAmount / goalAmount) * 100, 100) : 0;

    return (
        <div className="manage-card">
            <div className="manage-info">
                <h3>{campaign.title}</h3>
                <p>{(campaign.description || '').substring(0, 80)}...</p>
                <div className="manage-date">
                    <Calendar size={14} style={{ marginRight: '6px' }} />
                    {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No start date'}
                </div>
            </div>

            <div className="manage-stat">
                <span className="manage-stat-value">
                    <Users size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    {Array.isArray(campaign.volunteers) ? campaign.volunteers.length : (campaign.volunteers || 0)}
                </span>
                <span className="manage-stat-label">Volunteers</span>
            </div>

            <div className="manage-progress-stat">
                <div className="manage-stat-value">
                    <Target size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Rs {goalAmount.toLocaleString()}
                </div>
                <div className="manage-progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
                <span className="manage-stat-label">Fund Target (Rs {raisedAmount.toLocaleString()} raised)</span>
            </div>

            <div className="manage-stat">
                <span className="manage-stat-value">
                    <Clock size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    {calculateDaysLeft(getCampaignEndDate(campaign))}d
                </span>
                <span className="manage-stat-label">Duration</span>
            </div>

            <button
                className="details-btn"
                onClick={() => onDetails(campaign)}
            >
                details <ChevronRight size={16} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
            </button>
        </div>
    );
};

export default CampaignListItem;

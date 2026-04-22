import React from 'react';

const InterviewCard = ({ interview }) => {
    return (
        <div className="rescue-card-white">
            <div className="pet-image-container">
                <div className="placeholder-icon">
                    <div className="placeholder-rect"></div>
                </div>
            </div>

            <div className="rescue-info">
                <div className="info-item">
                    <span className="info-label">Pet id:</span>
                    <span className="info-value">{interview.petId}</span>
                </div>

                <div className="info-item">
                    <span className="info-label">Adoptee Name:</span>
                    <span className="info-value">{interview.adopteeName}</span>
                </div>

                <div className="info-item">
                    <span className="info-label">Contact:</span>
                    <span className="info-value">{interview.contact}</span>
                </div>
            </div>

            <div className="status-section">
                <div className="status-label">Timing</div>
                <div className="status-badge status-transit">
                    {interview.time}
                </div>
            </div>
        </div>
    );
};

export default InterviewCard;

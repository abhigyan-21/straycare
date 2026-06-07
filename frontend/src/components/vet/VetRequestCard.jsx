import React from 'react';
import { Check, X } from 'lucide-react';
import '../../styles/vet/VetRequestCard.css';

function VetRequestCard({ req, isNew = false, onAccept, onReject, onSetTime }) {
    const showActions = isNew || req.status === 'interview_scheduled';
    const isInterviewScheduled = req.status === 'interview_scheduled';

    return (
        <div className={`vet-request-card ${isNew ? 'new-request' : 'current-request'}`}>
            <div className="request-details">
                <div className="request-info-group">
                    <span className="request-label">name:</span>
                    <span className="request-value">{req.name}</span>
                </div>
                <div className="request-info-group">
                    <span className="request-label">contact:</span>
                    <span className="request-value">{req.contact}</span>
                </div>
            </div>

            <div className="request-status-section">
                <span className="status-title">Status</span>
                {showActions ? (
                    <div className="request-action-btns">
                        <button className="request-action-btn accept-btn" onClick={onAccept} title="Accept Application">
                            <Check size={20} />
                        </button>
                        <button className="request-action-btn reject-btn" onClick={onReject} title="Reject Application">
                            <X size={20} />
                        </button>
                        {!isInterviewScheduled && (
                            <button className="request-action-btn time-btn" onClick={() => onSetTime(req)}>
                                set time
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={`request-status-badge ${req.status}`}>
                        {req.status}
                    </div>
                )}
            </div>
        </div>
    );
}

export default VetRequestCard;

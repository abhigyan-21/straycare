import React from 'react';
import { Eye, Check, X } from 'lucide-react';

const RequestCard = ({ request, onApprove, onReject, onView }) => {
    return (
        <div className="admin-req-card">
            <div className="admin-req-card-header">
                <span className="admin-req-id">{request.id}</span>
                <span className="admin-req-date">{request.date}</span>
            </div>
            <h4 className="admin-req-name">{request.applicant}</h4>
            <p className="admin-req-pet">Applying for: <span className="admin-req-pet-bold">{request.petName}</span> ({request.type})</p>

            <div className="admin-req-actions">
                <button className="admin-btn-action secondary" onClick={() => onView && onView(request.id)}>
                    <Eye size={16} /> View
                </button>
                <button onClick={() => onApprove && onApprove(request.id)} className="admin-btn-action primary-flex">
                    <Check size={16} /> Approve
                </button>
                <button onClick={() => onReject && onReject(request.id)} className="admin-btn-action danger-flex">
                    <X size={16} /> Reject
                </button>
            </div>
        </div>
    );
};

export default RequestCard;

import React from 'react';
import StatusDropdown from '../StatusDropdown';
import '../../styles/vet/VetStatus.css';

function VetStatusCard({ id, status, onChange, options, image = null }) {
    return (
        <div className="status-card">
            <div className="pic-placeholder">
                {image ? <img src={image} alt="Pet" /> : 'pet pic'}
            </div>
            <div className="card-details">
                <span className="label">Id:</span>
                <span className="value">{id}</span>
            </div>
            <div className="status-control">
                <span className="status-label">Status</span>
                <StatusDropdown 
                    value={status} 
                    onChange={onChange}
                    options={options}
                />
            </div>
        </div>
    );
}

export default VetStatusCard;

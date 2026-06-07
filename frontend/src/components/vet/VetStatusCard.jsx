import React from 'react';
import StatusDropdown from '../StatusDropdown';
import '../../styles/vet/VetStatus.css';

function VetStatusCard({ id, name = null, status, onChange, options, image = null }) {
    return (
        <div className="status-card">
            <div className="pic-placeholder" style={{ width: '80px', height: '80px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f5f5f5', color: '#888' }}>
                {image ? <img src={image} alt="Pet" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'pet pic'}
            </div>
            <div className="card-details" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {name && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="label" style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase' }}>Name</span>
                        <span className="value" style={{ fontWeight: '600', color: '#333', fontSize: '1rem' }}>{name}</span>
                    </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="label" style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase' }}>Id</span>
                    <span className="value" style={{ color: '#555', fontSize: '0.9rem' }}>{id}</span>
                </div>
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

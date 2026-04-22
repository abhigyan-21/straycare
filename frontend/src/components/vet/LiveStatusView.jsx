import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/vet/VetDashboard.css';

function LiveStatusView({ rescues, title = "current pet being rescued" }) {
    const navigate = useNavigate();
    const getStatusClass = (status) => {
        const s = status.toLowerCase();
        if (s.includes('transit')) return 'status-transit';
        if (s.includes('clinic')) return 'status-clinic';
        if (s.includes('pickup')) return 'status-pickup';
        return '';
    };

    return (
        <div className="main-rescue-section">
            <h1 className="section-title">{title}</h1>
            <div className="rescues-scroll-wrapper">
                <div className="rescues-container">
                    {rescues && rescues.length > 0 ? (
                        rescues.map((rescue) => (
                            <div key={rescue.id} className="rescue-card-white">
                                <div className="pet-image-container">
                                    {rescue.image ? (
                                        <img src={rescue.image} alt="Rescued Pet" />
                                    ) : (
                                        <div className="placeholder-icon">
                                            <div className="placeholder-rect"></div>
                                        </div>
                                    )}
                                </div>

                                <div className="rescue-info">
                                    <div className="info-item">
                                        <span className="info-label">Report id:</span>
                                        <span className="info-value">{rescue.id}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Report:</span>
                                        <span className="info-value">{rescue.description}</span>
                                    </div>
                                </div>

                                <div className="status-section">
                                    <div className="status-label">status</div>
                                    <div 
                                        className={`status-badge ${getStatusClass(rescue.status)}`}
                                        onClick={() => navigate(`/tracking/${rescue.id}`)}
                                        style={{ cursor: 'pointer' }}
                                        title="Click to track live"
                                    >
                                        {rescue.status}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-rescues-message" style={{textAlign: 'center', padding: '20px', color: '#666'}}>
                            No active rescues at the moment.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default LiveStatusView;

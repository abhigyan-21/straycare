import React from 'react';

const SupportModal = ({ card, onClose, hasVolunteered, onVolunteer, getBackgroundImage }) => {
    if (!card) return null;

    return (
        <div className="help-modal-overlay">
            <div className="help-modal-backdrop" onClick={onClose}></div>
            <div className="expanded-card">
                <div
                    className="expanded-card-bg"
                    style={{ backgroundImage: getBackgroundImage() }}
                />
                <button className="close-btn" onClick={onClose}>&times;</button>
                <div className="expanded-content">
                    <h2>{card.title}</h2>
                    <p className="details-text">{card.details}</p>

                    <div className="support-actions">
                        <span className="support-prefix">I would like to support by</span>
                        <button className="action-btn">Donating</button>
                        {card.id === 4 ? (
                            <button
                                className="action-btn"
                                style={{
                                    backgroundColor: hasVolunteered ? '#ccc' : '',
                                    color: hasVolunteered ? '#666' : '',
                                    cursor: hasVolunteered ? 'default' : 'pointer'
                                }}
                                onClick={() => !hasVolunteered && onVolunteer()}
                            >
                                {hasVolunteered ? "sorry I wouldn't volunteer" : "I would like to volunteer"}
                            </button>
                        ) : (
                            <button className="action-btn outline">starting a autopay</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupportModal;

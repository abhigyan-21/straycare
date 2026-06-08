import React, { useState } from 'react';


const SupportModal = ({
    card,
    onClose,
    isLoggedIn,
    hasVolunteered,
    volunteerPending,
    cooldownRemaining,
    onVolunteerRegister,
    onVolunteerCancel,
    campaigns = [],
    isLoadingCampaigns,
    onDonate,
    getBackgroundImage,
    openAuthModal,
    initialViewMode,
    initialSelectedCampaign
}) => {
    if (!card) return null;

    // View mode: 'main', 'donations', 'payment', 'success'
    const [viewMode, setViewMode] = useState(initialViewMode || 'main');
    const [confirmingVolunteer, setConfirmingVolunteer] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(initialSelectedCampaign || null);
    const [donationAmount, setDonationAmount] = useState('1000');
    const [customAmount, setCustomAmount] = useState('');
    const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

    const handleVolunteerClick = () => {
        if (!isLoggedIn) {
            openAuthModal('signin');
            return;
        }
        setConfirmingVolunteer(true);
    };

    const confirmVolunteerEnrollment = async () => {
        setConfirmingVolunteer(false);
        await onVolunteerRegister();
    };

    const handleDonatingClick = () => {
        if (card.id === 4) {
            setViewMode('donations');
        } else {
            setSelectedCampaign({
                id: `general-card-${card.id}`,
                title: card.title
            });
            setViewMode('payment');
        }
    };

    const handleSelectCampaign = (camp) => {
        setSelectedCampaign(camp);
        setViewMode('payment');
    };

    const handlePaySubmit = async (e) => {
        e.preventDefault();
        const amount = customAmount ? parseFloat(customAmount) : parseFloat(donationAmount);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid donation amount.');
            return;
        }

        setIsPaymentProcessing(true);

        // Simulate a 2-second premium payment gateway processing loader
        setTimeout(async () => {
            const success = await onDonate(selectedCampaign.id, amount);
            setIsPaymentProcessing(false);
            if (success) {
                setViewMode('success');
            } else {
                alert('Donation failed. Please try again.');
            }
        }, 2000);
    };

    const handleClose = () => {
        // Reset local states
        setViewMode('main');
        setConfirmingVolunteer(false);
        setSelectedCampaign(null);
        setCustomAmount('');
        onClose();
    };

    const renderContent = () => {
        if (viewMode === 'main') {
            return (
                <div className="expanded-content">
                    <h2>{card.title}</h2>
                    <p className="details-text">{card.details}</p>

                    <div className="support-actions">
                        {confirmingVolunteer ? (
                            <div className="volunteer-reconfirm">
                                <p className="reconfirm-title">Are you sure you want to register as a volunteer?</p>
                                <p className="reconfirm-subtitle">You will receive notifications of upcoming outreach campaigns.</p>
                                <div className="reconfirm-buttons">
                                    <button className="confirm-btn" onClick={confirmVolunteerEnrollment}>Yes, Confirm</button>
                                    <button className="cancel-btn outline" onClick={() => setConfirmingVolunteer(false)}>Go Back</button>
                                </div>
                            </div>
                        ) : volunteerPending ? (
                            <div className="volunteer-pending-card">
                                <div className="pending-badge">PENDING COOLDOWN</div>
                                <p className="thank-you-msg">Thank you for volunteering! Your registration will commit in {cooldownRemaining}s.</p>
                                <button
                                    className="action-btn cancel-volunteer-btn"
                                    onClick={onVolunteerCancel}
                                >
                                    sorry I wouldn't volunteer
                                </button>
                            </div>
                        ) : hasVolunteered ? (
                            <div className="volunteer-applied-card">
                                <div className="success-badge">✓ ENROLLED</div>
                                <p className="thank-you-msg">Thank you for volunteering! You are now part of our volunteer pool.</p>
                                <button
                                    className="action-btn cancel-volunteer-btn"
                                    onClick={onVolunteerCancel}
                                >
                                    sorry I wouldn't volunteer
                                </button>
                            </div>
                        ) : (
                            <>
                                <span className="support-prefix">I would like to support by</span>
                                <button className="action-btn" onClick={handleDonatingClick}>Donating</button>
                                {card.id === 4 ? (
                                    <button className="action-btn" onClick={handleVolunteerClick}>
                                        I would like to volunteer
                                    </button>
                                ) : (
                                    <button className="action-btn outline">starting a autopay</button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            );
        }

        if (viewMode === 'donations') {
            return (
                <div className="expanded-content modal-scroll-view">
                    <button className="back-arrow-btn" onClick={() => setViewMode('main')}>← Back</button>
                    <h2>Select a Campaign to Support</h2>

                    {isLoadingCampaigns ? (
                        <div className="modal-loader">Loading campaigns...</div>
                    ) : campaigns.length === 0 ? (
                        <p className="no-campaigns-text">No active campaigns at this time. Check back soon!</p>
                    ) : (
                        <div className="modal-campaigns-list">
                            {campaigns.map((camp) => {
                                const progress = camp.goalAmount > 0
                                    ? Math.min(100, Math.round(((camp.raisedAmount || 0) / camp.goalAmount) * 100))
                                    : 0;

                                return (
                                    <div key={camp.id} className="modal-campaign-card">
                                        {camp.image && (
                                            <div
                                                className="modal-camp-img"
                                                style={{ backgroundImage: `url(${camp.image})` }}
                                            />
                                        )}
                                        <div className="modal-camp-info">
                                            <h3>{camp.title}</h3>
                                            <p>{camp.description}</p>

                                            <div className="modal-camp-progress-container">
                                                <div className="modal-camp-progress-bar">
                                                    <div className="modal-camp-progress-fill" style={{ width: `${progress}%` }}></div>
                                                </div>
                                                <div className="modal-camp-progress-labels">
                                                    <span>₹{camp.raisedAmount?.toLocaleString() || '0'} raised</span>
                                                    <span>Goal: ₹{camp.goalAmount?.toLocaleString() || '0'}</span>
                                                </div>
                                            </div>

                                            <button
                                                className="action-btn donate-camp-btn"
                                                onClick={() => handleSelectCampaign(camp)}
                                            >
                                                Donate to this Campaign
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        }

        if (viewMode === 'payment') {
            const amount = customAmount ? parseFloat(customAmount) : parseFloat(donationAmount);
            return (
                <div className="expanded-content">
                    <button className="back-arrow-btn" onClick={() => {
                        if (card.id === 4) {
                            setViewMode('donations');
                        } else {
                            setViewMode('main');
                        }
                    }}>← Back</button>
                    <h2>Donate to {selectedCampaign?.title}</h2>

                    {isPaymentProcessing ? (
                        <div className="payment-processing-loader">
                            <div className="spinner"></div>
                            <p>Processing secure payment via gateway...</p>
                        </div>
                    ) : (
                        <form onSubmit={handlePaySubmit} className="payment-form">
                            <p className="payment-helper">Select or enter your donation amount in INR (₹):</p>

                            <div className="preset-amounts">
                                {['500', '1000', '2000', '5000'].map((amt) => (
                                    <button
                                        key={amt}
                                        type="button"
                                        className={`preset-btn ${donationAmount === amt && !customAmount ? 'active' : ''}`}
                                        onClick={() => {
                                            setDonationAmount(amt);
                                            setCustomAmount('');
                                        }}
                                    >
                                        ₹{amt}
                                    </button>
                                ))}
                            </div>

                            <div className="custom-amount-input">
                                <span>₹</span>
                                <input
                                    type="number"
                                    placeholder="Enter custom amount"
                                    value={customAmount}
                                    min="1"
                                    onChange={(e) => {
                                        setCustomAmount(e.target.value);
                                        setDonationAmount('');
                                    }}
                                />
                            </div>

                            <button type="submit" className="action-btn proceed-pay-btn">
                                Proceed to Pay ₹{isNaN(amount) ? '0' : amount.toLocaleString()}
                            </button>
                        </form>
                    )}
                </div>
            );
        }

        if (viewMode === 'success') {
            const amount = customAmount ? parseFloat(customAmount) : parseFloat(donationAmount);
            return (
                <div className="expanded-content payment-success-view">
                    <div className="success-checkmark-circle">
                        <div className="success-checkmark-stem"></div>
                        <div className="success-checkmark-kick"></div>
                    </div>
                    <h2>Donation Successful!</h2>
                    <p className="success-thanks-text">
                        Thank you so much for your generous support of <strong>₹{amount.toLocaleString()}</strong> {card.id === 4 ? <>to the <strong>{selectedCampaign?.title}</strong> campaign.</> : <>for <strong>{selectedCampaign?.title}</strong>.</>}
                    </p>
                    <p className="success-thanks-text">
                        Your contribution makes a life-saving difference in local rescue and treatment operations!
                    </p>
                    <button className="action-btn close-success-btn" onClick={() => {
                        if (card.id === 4) {
                            setViewMode('donations');
                        } else {
                            setViewMode('main');
                        }
                    }}>
                        {card.id === 4 ? 'Back to Campaigns' : 'Back'}
                    </button>
                </div>
            );
        }
    };

    return (
        <div className="help-modal-overlay">
            <div className="help-modal-backdrop" onClick={handleClose}></div>
            <div className="expanded-card">
                <div
                    className="expanded-card-bg"
                    style={{ backgroundImage: getBackgroundImage() }}
                />
                <button className="close-btn" onClick={handleClose}>
                    <span style={{ color: 'white', fontSize: '1.2rem' }}>X</span>
                </button>
                {renderContent()}
            </div>
        </div>
    );
};

export default SupportModal;

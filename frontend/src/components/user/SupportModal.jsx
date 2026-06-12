import React, { useState, useEffect } from 'react';
import apiClient, { getPartner } from '../../services/api';


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
    
    // Razorpay Integration States
    const [paymentMode, setPaymentMode] = useState('one-time'); // 'one-time' | 'autopay'
    const [splitRecommendation, setSplitRecommendation] = useState([]);
    const [isLoadingSplit, setIsLoadingSplit] = useState(false);

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
            setPaymentMode('one-time');
            setSelectedCampaign({
                id: `general-card-${card.id}`,
                title: card.title
            });
            setViewMode('payment');
        }
    };

    const handleAutopayClick = () => {
        if (card.id !== 4) {
            setPaymentMode('autopay');
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

        if (!isLoggedIn) {
            openAuthModal('signin');
            return;
        }

        setIsPaymentProcessing(true);

        try {
            if (card.id === 4) {
                // MVP Manual Donation Flow for Campaigns
                await apiClient.post(`/campaigns/${selectedCampaign.id}/donate-manual`, {
                    amount: amount
                });
                setIsPaymentProcessing(false);
                setViewMode('success');
                return;
            }

            // New Razorpay Smart Hub Flow
            let category = 'FOOD';
            if (card.id === 2) category = 'TREATMENT';
            if (card.id === 3) category = 'SHELTER';

            let options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_YourKeyHere',
                amount: Math.round(amount * 100),
                currency: "INR",
                name: "Furzo",
                description: `Support ${category} Hub`,
                handler: async function (response) {
                    setIsPaymentProcessing(false);
                    setViewMode('success');
                },
                prefill: {
                    name: "Donor",
                },
                theme: {
                    color: "#346c02"
                }
            };

            if (paymentMode === 'one-time') {
                if (splitRecommendation && splitRecommendation.length > 0) {
                    const res = await apiClient.post('/funding/confirm-split', {
                        totalAmount: amount,
                        splits: splitRecommendation
                    });
                    if (res.data && res.data.order) {
                        options.order_id = res.data.order.id;
                    }
                } else {
                    // Fallback to regular donate if no splits available in this hub
                    const typeMap = { 1: 'FOOD', 2: 'TREATMENT', 3: 'SHELTER' };
                    const res = await apiClient.post('/funding/donate', {
                        amount: amount,
                        type: typeMap[card.id] || 'FOOD',
                        partnerId: 'mock-partner-id'
                    });
                    if (res.data && res.data.order) {
                        options.order_id = res.data.order.id;
                    }
                }
            } else if (paymentMode === 'autopay') {
                const res = await apiClient.post(`/funding/hubs/${category}/subscribe`, { amount });
                if (res.data && res.data.subscriptionId) {
                    options.subscription_id = res.data.subscriptionId;
                    // For subscriptions, amount and order_id are not passed, only subscription_id
                    delete options.amount;
                    delete options.order_id;
                }
            }

            const rzp = new window.Razorpay(options);
            
            rzp.on('payment.failed', function (response){
                setIsPaymentProcessing(false);
                alert('Payment failed: ' + response.error.description);
            });
            
            rzp.open();

        } catch (err) {
            console.error("Payment setup failed:", err);
            setIsPaymentProcessing(false);
            alert('Failed to initialize payment. Please try again later.');
        }
    };

    // Fetch Smart Recommendation Split dynamically
    useEffect(() => {
        if (viewMode === 'payment' && card.id !== 4) {
            const amount = customAmount ? parseFloat(customAmount) : parseFloat(donationAmount);
            if (isNaN(amount) || amount <= 0) {
                setSplitRecommendation([]);
                return;
            }

            let category = 'FOOD';
            if (card.id === 2) category = 'TREATMENT';
            if (card.id === 3) category = 'SHELTER';

            setIsLoadingSplit(true);
            apiClient.post('/funding/split-donate', { amount, category })
                .then(res => {
                    if (res.data && res.data.status === 'success') {
                        setSplitRecommendation(res.data.data || []);
                    }
                })
                .catch(err => {
                    console.warn("Failed to fetch split:", err);
                    setSplitRecommendation([]);
                })
                .finally(() => setIsLoadingSplit(false));
        }
    }, [viewMode, customAmount, donationAmount, card.id]);

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
            const isVolunteerCard = card.id === 4;

            return (
                <div className="expanded-content">
                    <h2>{card.title}</h2>
                    <p className="details-text">{card.details}</p>

                    <div className="support-actions">
                        {isVolunteerCard && confirmingVolunteer ? (
                            <div className="volunteer-reconfirm">
                                <p className="reconfirm-title">Are you sure you want to register as a volunteer?</p>
                                <p className="reconfirm-subtitle">You will receive notifications of upcoming outreach campaigns.</p>
                                <div className="reconfirm-buttons">
                                    <button className="confirm-btn" onClick={confirmVolunteerEnrollment}>Yes, Confirm</button>
                                    <button className="cancel-btn outline" onClick={() => setConfirmingVolunteer(false)}>Go Back</button>
                                </div>
                            </div>
                        ) : isVolunteerCard && volunteerPending ? (
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
                        ) : isVolunteerCard && hasVolunteered ? (
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
                                {!isVolunteerCard && <span className="support-prefix">I would like to support by</span>}
                                {!isVolunteerCard && <button className="action-btn" onClick={handleDonatingClick}>Donating</button>}
                                {isVolunteerCard ? (
                                    <button className="action-btn" onClick={handleVolunteerClick}>
                                        I would like to volunteer
                                    </button>
                                ) : (
                                    <button className="action-btn outline" onClick={handleAutopayClick}>starting a autopay</button>
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

                            {card.id === 4 ? (() => {
                                const partner = getPartner(selectedCampaign);
                                return (
                                <div className="manual-upi-section" style={{ marginTop: '0', padding: '10px', backgroundColor: '#f9fbf7', borderRadius: '12px', textAlign: 'center', border: '1px solid #e0e0e0', maxWidth: '320px', margin: '0 auto', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                    <h4 style={{ margin: '0 0 2px 0', color: '#1a1a1a', fontSize: '1rem' }}>Direct UPI Transfer</h4>
                                    <p style={{ fontSize: '0.8rem', color: '#555', marginBottom: '4px', lineHeight: '1.2' }}>
                                        Transfer your donation using any UPI app to the details below, then click "I have paid".
                                    </p>
                                    
                                    {partner?.upiQrCode ? (
                                        <div style={{ marginBottom: '6px' }}>
                                            <img src={partner.upiQrCode} alt="UPI QR Code" style={{ width: '150px', height: '150px', objectFit: 'contain', border: '1px solid #ddd', borderRadius: '8px', padding: '5px', background: '#fff' }} />
                                        </div>
                                    ) : (
                                        <div style={{ marginBottom: '6px', padding: '8px', background: '#f5f5f5', borderRadius: '8px', border: '1px dashed #ccc' }}>
                                            <p style={{ color: '#888', margin: 0, fontSize: '0.8rem' }}>QR Code not available</p>
                                        </div>
                                    )}
                                    
                                    <div style={{ background: '#fff', padding: '4px 8px', borderRadius: '6px', border: '1px solid #ddd', display: 'inline-block', marginBottom: '8px' }}>
                                        <strong style={{ color: '#333', fontSize: '0.85rem' }}>UPI ID:</strong> <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', marginLeft: '5px' }}>{partner?.upiId || 'Not provided'}</span>
                                    </div>
                                    
                                    <button type="submit" className="action-btn proceed-pay-btn" style={{ width: '100%', background: '#346c02', color: '#fff', padding: '8px', fontSize: '0.95rem' }} disabled={!partner?.upiId && !partner?.upiQrCode}>
                                        I have Paid ₹{isNaN(amount) ? '0' : amount.toLocaleString()}
                                    </button>
                                </div>
                                );
                            })() : (
                                <>
                                    <div className="split-recommendation-box" style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f9fbf7', borderRadius: '8px', textAlign: 'left' }}>
                                        <h4 style={{ margin: '0 0 10px 0', color: '#346c02', fontSize: '0.95rem' }}>Smart Routing Breakdown:</h4>
                                        {isLoadingSplit ? (
                                            <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>Calculating optimal impact...</p>
                                        ) : splitRecommendation.length > 0 ? (
                                            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#444' }}>
                                                {splitRecommendation.map((split, i) => (
                                                    <li key={i} style={{ marginBottom: '4px' }}>
                                                        <strong>₹{split.amount}</strong> to support request #{split.campaignId.substring(0,6)}...
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>Funds will be dynamically allocated to the most urgent rescues in this category.</p>
                                        )}
                                        {paymentMode === 'autopay' && (
                                            <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '10px', fontStyle: 'italic', marginBottom: 0 }}>
                                                * This split will be dynamically updated every month to ensure your money always goes to the most urgent rescues.
                                            </p>
                                        )}
                                    </div>
                                    <button type="submit" className="action-btn proceed-pay-btn" style={{ marginTop: '20px' }}>
                                        {paymentMode === 'autopay' ? `Set up ₹${isNaN(amount) ? '0' : amount.toLocaleString()}/month` : `Proceed to Pay ₹${isNaN(amount) ? '0' : amount.toLocaleString()}`}
                                    </button>
                                </>
                            )}
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
            <div className="expanded-card" style={viewMode === 'payment' ? { maxWidth: '500px', minHeight: 'auto', padding: '1.5rem 2rem' } : {}}>
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

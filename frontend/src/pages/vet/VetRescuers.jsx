import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { UserPlus, Trash2, Mail, Phone, Users, Shield } from 'lucide-react';

import '../../styles/vet/VetRescuers.css';
import '../../styles/AuthModal.css';
import ActionLoader from '../../components/ActionLoader';
import apiClient from '../../services/api';
import { useVetDataStore } from '../../store/vetDataStore';

const VetRescuers = () => {

    const [rescuers, setRescuers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [otpError, setOtpError] = useState('');
    const otpInputsRef = useRef([]);

    const { fetchRescuers: fetchRescuersFromStore, invalidateRescuers } = useVetDataStore();

    const [formData, setFormData] = useState({
        email: '',
        contact: ''
    });

    const fetchRescuers = async (force = false) => {
        setIsLoading(true);
        const startTime = Date.now();
        try {
            const data = await fetchRescuersFromStore(force);
            setRescuers(data || []);
        } catch (error) {
            console.warn("Failed to fetch rescuers:", error.message);
            setRescuers([]);
        } finally {
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, 800 - elapsedTime);
            setTimeout(() => {
                setIsLoading(false);
            }, remainingTime);
        }
    };

    useEffect(() => {
        fetchRescuers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddRescuer = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await apiClient.post('/users/rescuers/request-add-otp', { email: formData.email });
            setShowOtpModal(true);
            setOtpDigits(['', '', '', '', '', '']);
            setOtpError('');
            setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
        } catch (error) {
            console.error('API failed:', error);
            const errorMsg = error.response?.data?.error || error.message;
            alert(`Failed to request OTP: ${errorMsg}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otpDigits];
        newOtp[index] = value;
        setOtpDigits(newOtp);
        if (value && index < 5) {
            otpInputsRef.current[index + 1].focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            otpInputsRef.current[index - 1].focus();
        }
    };

    const handleVerifyOtp = async () => {
        const otp = otpDigits.join('');
        if (otp.length !== 6) {
            setOtpError('Please enter a 6-digit OTP');
            return;
        }

        setVerifyingOtp(true);
        setOtpError('');

        try {
            const response = await apiClient.post('/users/rescuers/add', { ...formData, otp });
            const data = response.data;
            invalidateRescuers();
            setRescuers(prev => [data.rescuer, ...prev]);
            setFormData({ email: '', contact: '' });
            setShowOtpModal(false);
            alert('Rescuer added successfully!');
        } catch (error) {
            console.error('API failed:', error);
            setOtpError(error.response?.data?.error || error.message || 'Failed to verify OTP');
        } finally {
            setVerifyingOtp(false);
        }
    };

    const handleRemoveRescuer = async (id) => {
        if (!window.confirm('Are you sure you want to remove this rescuer? They will lose access to rescuer features.')) {
            return;
        }

        try {
            await apiClient.post(`/users/rescuers/remove/${id}`);
            invalidateRescuers();
            setRescuers(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error('API failed:', error);
            const errorMsg = error.response?.data?.error || error.message;
            alert(`Failed to remove rescuer: ${errorMsg}`);
        }
    };

    return (
        <>
            <Helmet>
                <title>Furzo Vet Portal - Rescuers</title>
                <meta name="description" content="Manage your clinic's rescue staff, assign rescuer privileges, and coordinate field operations on the Furzo Vet Portal." />
            </Helmet>
            <div className="vet-rescuers-page">
                <div className="rescuers-header">
                    <h1>Rescuer Management</h1>
                    <p>Manage your clinic's rescue staff and assign privileges.</p>
                </div>

                {/* Add Rescuer Form */}
                <div className="add-rescuer-card">
                    <h2><UserPlus size={24} /> Promote User to Rescuer</h2>
                    <form className="rescuer-form" onSubmit={handleAddRescuer}>
                        <div className="form-group">
                            <label>User Email</label>
                            <input
                                type="email"
                                name="email"
                                placeholder="staff@example.com"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Contact Number</label>
                            <input
                                type="tel"
                                name="contact"
                                placeholder="+91 XXXXX XXXXX"
                                value={formData.contact}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <button type="submit" className="add-btn" disabled={isSubmitting}>
                            {isSubmitting ? 'Processing...' : 'Add Rescuer'}
                        </button>
                    </form>
                </div>

                {/* Rescuers List */}
                <div className="rescuers-list-section">
                    <h2><Users size={24} style={{ verticalAlign: 'middle', marginRight: '10px' }} /> Your Rescuer Team </h2>

                    {isLoading ? (
                        <ActionLoader message="Syncing rescuer data..." />
                    ) : (
                        <div className="rescuers-grid">
                            {rescuers.length > 0 ? (
                                rescuers.map(rescuer => (
                                    <div key={rescuer.id} className="rescuer-card">
                                        <div className="rescuer-avatar">
                                            {rescuer.avatarUrl ? (
                                                <img src={rescuer.avatarUrl} alt={rescuer.name} />
                                            ) : (
                                                <Shield size={30} color="#80ff1eff" />
                                            )}
                                        </div>
                                        <div className="rescuer-info">
                                            <h3>{rescuer.name}</h3>
                                            <p><Mail size={14} style={{ marginRight: '5px' }} /> {rescuer.email}</p>
                                            <p><Phone size={14} style={{ marginRight: '5px' }} /> {rescuer.contact}</p>
                                            <p style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '4px' }}>ID: {rescuer.id}</p>
                                        </div>
                                        <button
                                            className="remove-btn"
                                            onClick={() => handleRemoveRescuer(rescuer.id)}
                                            title="Remove Privileges"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">
                                    <p>No rescuers added yet. Use the form above to add your staff.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* OTP Modal */}
                {showOtpModal && (
                    <div className="auth-modal-overlay">
                        <div className="auth-modal-content otp-modal">
                            <h2>Verify Rescuer</h2>
                            <p>An OTP has been sent to <strong>{formData.email}</strong>. Please ask the user to provide it to finalize the addition.</p>
                            
                            <div className="otp-container">
                                {otpDigits.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => (otpInputsRef.current[index] = el)}
                                        type="text"
                                        maxLength="1"
                                        className="otp-digit-input"
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        disabled={verifyingOtp}
                                    />
                                ))}
                            </div>
                            
                            {otpError && <p className="auth-error">{otpError}</p>}
                            
                            <div className="auth-otp-actions">
                                <button
                                    className="auth-submit-btn verify-btn"
                                    onClick={handleVerifyOtp}
                                    disabled={verifyingOtp || otpDigits.join('').length !== 6}
                                >
                                    {verifyingOtp ? 'Verifying...' : 'Verify & Add'}
                                </button>
                                <button
                                    className="auth-secondary-btn"
                                    onClick={() => setShowOtpModal(false)}
                                    disabled={verifyingOtp}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default VetRescuers;

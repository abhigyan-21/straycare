import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerPartner, sendRegistrationOtp, verifyRegistrationOtp } from '../../services/api';
import '../../styles/user/Register.css';

const Register = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        organizationName: '',
        organizationType: 'ngo',
        email: '',
        phone: '',
        registrationNumber: '',
        address: '',
        password: '',
        confirmPassword: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    // OTP Verification State
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [verificationToken, setVerificationToken] = useState('');
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [resendTimer, setResendTimer] = useState(0);

    const otpInputsRef = useRef([]);

    // Resend Timer Effect
    useEffect(() => {
        let interval;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    const handleChange = (e) => {
        let { name, value } = e.target;
        if (name === 'phone') {
            // Keep only digits and restrict to exactly 10 characters
            value = value.replace(/\D/g, '').slice(0, 10);
        }
        setFormData({ ...formData, [name]: value });
    };

    // First Step: Request OTP when form is submitted
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        if (formData.phone.length !== 10) {
            alert("Phone number must be exactly 10 digits!");
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const data = await sendRegistrationOtp(formData.email);
            setVerificationToken(data.verificationToken);
            setShowOtpModal(true);
            setResendTimer(30);
            setOtpDigits(['', '', '', '', '', '']);
            // Wait for render, then focus first input
            setTimeout(() => {
                otpInputsRef.current[0]?.focus();
            }, 100);
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.error || err.message || "Failed to send verification OTP.";
            setSubmitError(msg);
            alert("Error sending OTP: " + msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Resend OTP handler
    const handleResendOtp = async () => {
        if (resendTimer > 0) return;
        setOtpError('');
        try {
            const data = await sendRegistrationOtp(formData.email);
            setVerificationToken(data.verificationToken);
            setResendTimer(30);
            setOtpDigits(['', '', '', '', '', '']);
            otpInputsRef.current[0]?.focus();
            alert("A new Email OTP has been sent!");
        } catch (err) {
            console.error(err);
            setOtpError(err.response?.data?.error || err.message || "Failed to resend OTP.");
        }
    };

    // OTP Input Navigation Handlers
    const handleOtpChange = (index, value) => {
        if (isNaN(value)) return;
        const newDigits = [...otpDigits];
        newDigits[index] = value.substring(value.length - 1);
        setOtpDigits(newDigits);
        setOtpError('');

        // Move to next input
        if (value && index < 5) {
            otpInputsRef.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace') {
            if (!otpDigits[index] && index > 0) {
                const newDigits = [...otpDigits];
                newDigits[index - 1] = '';
                setOtpDigits(newDigits);
                otpInputsRef.current[index - 1]?.focus();
            } else {
                const newDigits = [...otpDigits];
                newDigits[index] = '';
                setOtpDigits(newDigits);
            }
            setOtpError('');
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pastedData.length === 6) {
            const newDigits = pastedData.split('');
            setOtpDigits(newDigits);
            otpInputsRef.current[5]?.focus();
            setOtpError('');
        }
    };

    // Second Step: Verify OTP and Register
    const handleVerifyAndRegister = async (e) => {
        e.preventDefault();
        const otpString = otpDigits.join('');
        if (otpString.length !== 6) {
            setOtpError("Please enter all 6 digits of the OTP.");
            return;
        }

        setVerifyingOtp(true);
        setOtpError('');
        try {
            // 1. Verify OTP against backend
            const verifyRes = await verifyRegistrationOtp(formData.email, otpString, verificationToken);
            const { registerToken } = verifyRes;

            // 2. Submit the registration details with verification token
            await registerPartner({
                organizationName: formData.organizationName,
                organizationType: formData.organizationType,
                email: formData.email,
                phone: formData.phone,
                registrationNumber: formData.registrationNumber,
                address: formData.address,
                password: formData.password,
                registerToken: registerToken
            });

            alert("Partner registration application submitted successfully for review!");
            setShowOtpModal(false);
            navigate('/');
        } catch (err) {
            console.error(err);
            setOtpError(err.response?.data?.error || err.message || "Verification or registration failed.");
        } finally {
            setVerifyingOtp(false);
        }
    };

    return (
        <div className="register-page">
            <div className="register-container">
                <div className="register-header">
                    <h2>Partner Registration</h2>
                    <p>Join StrayCare to help strays around your area.</p>
                </div>

                <form className="register-form" onSubmit={handleSubmit}>
                    <div className="form-group-row">
                        <div className="form-group">
                            <label>Organization Name</label>
                            <input 
                                type="text" 
                                name="organizationName" 
                                value={formData.organizationName} 
                                onChange={handleChange} 
                                placeholder="Care Foundation" 
                                required 
                            />
                        </div>
                        <div className="form-group">
                            <label>Organization Type</label>
                            <select 
                                name="organizationType" 
                                value={formData.organizationType} 
                                onChange={handleChange} 
                                required
                            >
                                <option value="ngo">NGO</option>
                                <option value="vet">Vet Clinic</option>
                                <option value="hospital">Hospital</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group-row">
                        <div className="form-group">
                            <label>Email Address</label>
                            <input 
                                type="email" 
                                name="email" 
                                value={formData.email} 
                                onChange={handleChange} 
                                placeholder="contact@example.com" 
                                required 
                            />
                        </div>
                        <div className="form-group">
                            <label>Phone Number</label>
                            <input 
                                type="tel" 
                                name="phone" 
                                value={formData.phone} 
                                onChange={handleChange} 
                                placeholder="10-digit mobile number" 
                                required 
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Registration Number</label>
                        <input 
                            type="text" 
                            name="registrationNumber" 
                            value={formData.registrationNumber} 
                            onChange={handleChange} 
                            placeholder="Government/License Registration No." 
                            required 
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Address</label>
                        <textarea 
                            name="address" 
                            value={formData.address} 
                            onChange={handleChange} 
                            placeholder="Full physical address" 
                            rows="2"
                            required 
                        ></textarea>
                    </div>

                    <div className="form-group-row">
                        <div className="form-group">
                            <label>Password</label>
                            <div className="password-input-wrapper">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    name="password" 
                                    value={formData.password} 
                                    onChange={handleChange} 
                                    placeholder="Create a strong password" 
                                    required 
                                />
                                <button
                                    type="button"
                                    className="show-password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <div className="password-input-wrapper">
                                <input 
                                    type={showConfirmPassword ? "text" : "password"} 
                                    name="confirmPassword" 
                                    value={formData.confirmPassword} 
                                    onChange={handleChange} 
                                    placeholder="Confirm your password" 
                                    required 
                                />
                                <button
                                    type="button"
                                    className="show-password-toggle"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                >
                                    {showConfirmPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {submitError && (
                        <div style={{ color: '#e0645c', textAlign: 'center', marginBottom: '16px', fontSize: '0.9rem', fontWeight: '500' }}>
                            {submitError}
                        </div>
                    )}
                    <button type="submit" className="register-submit-btn" disabled={isSubmitting}>
                        {isSubmitting ? "Sending verification email..." : "Register as Partner"}
                    </button>
                </form>
            </div>

            {/* OTP Verification Modal Overlay */}
            {showOtpModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 9999
                }}>
                    <div className="otp-modal-content" style={{
                        background: 'white',
                        padding: '32px',
                        borderRadius: '16px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                        width: '100%',
                        maxWidth: '440px',
                        textAlign: 'center',
                        border: '1px solid #e2e8f0'
                    }}>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#2d3748', marginBottom: '8px' }}>
                            Verify Email Address
                        </h3>
                        <p style={{ color: '#718096', fontSize: '0.9rem', marginBottom: '24px' }}>
                            We have sent a 6-digit OTP code to <strong style={{ color: '#2d3748' }}>{formData.email}</strong>. Please enter it below.
                        </p>

                        <form onSubmit={handleVerifyAndRegister}>
                            <div className="otp-inputs-wrapper" style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: '8px',
                                marginBottom: '20px'
                            }}>
                                {otpDigits.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        type="text"
                                        maxLength="1"
                                        value={digit}
                                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                        onPaste={handleOtpPaste}
                                        ref={(el) => (otpInputsRef.current[idx] = el)}
                                        disabled={verifyingOtp}
                                        style={{
                                            width: '48px',
                                            height: '52px',
                                            fontSize: '1.5rem',
                                            fontWeight: '700',
                                            textAlign: 'center',
                                            border: '2px solid #e2e8f0',
                                            borderRadius: '8px',
                                            outline: 'none',
                                            transition: 'border-color 0.2s',
                                            background: '#f8fafc',
                                            color: '#2d3748'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#346c02'}
                                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                    />
                                ))}
                            </div>

                            {otpError && (
                                <div style={{ color: '#e0645c', fontSize: '0.85rem', marginBottom: '16px', fontWeight: '500' }}>
                                    {otpError}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={verifyingOtp}
                                style={{
                                    width: '100%',
                                    background: '#346c02',
                                    color: 'white',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    fontSize: '1rem',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                    marginBottom: '16px'
                                }}
                            >
                                {verifyingOtp ? "Verifying OTP & Enrolling..." : "Verify & Complete"}
                            </button>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowOtpModal(false)}
                                    disabled={verifyingOtp}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#718096',
                                        cursor: 'pointer',
                                        fontWeight: '500'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={resendTimer > 0 || verifyingOtp}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: resendTimer > 0 ? '#cbd5e1' : '#346c02',
                                        cursor: resendTimer > 0 ? 'default' : 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Register;
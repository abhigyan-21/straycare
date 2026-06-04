import { useState, useEffect, useRef } from 'react';
import '../styles/AuthModal.css';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const AuthModal = ({ isOpen, onClose, initialMode = 'signin' }) => {
    const [mode, setMode] = useState(initialMode);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [timer, setTimer] = useState(0);
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const otpInputsRef = useRef([]);

    const {
        isLoggedIn,
        user,
        isLoading,
        loginAction,
        registerAction,
        verifyEmailAction,
        verifyPhoneAction,
        resendEmailOtpAction,
        resendPhoneOtpAction,
        logout
    } = useAuthStore();
    const navigate = useNavigate();

    // Reset mode and states when opened/initialMode changes
    useEffect(() => {
        if (isOpen) {
            setMode(initialMode);
            setError('');
            setSuccessMessage('');
            setOtpDigits(['', '', '', '', '', '']);
            if (initialMode === 'verify-email' || initialMode === 'verify-phone') {
                setTimer(60);
            } else {
                setTimer(0);
            }
        }
    }, [isOpen, initialMode]);

    // Recursive timeout for countdown timer
    useEffect(() => {
        if (timer > 0) {
            const timeout = setTimeout(() => {
                setTimer(prev => prev - 1);
            }, 1000);
            return () => clearTimeout(timeout);
        }
    }, [timer]);

    if (!isOpen) return null;

    const handleClose = () => {
        // Force logout if modal is closed while unverified
        if (isLoggedIn && user && (!user.isEmailVerified || !user.isPhoneVerified)) {
            logout();
        }
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email');
        const password = formData.get('password');
        const name = formData.get('name');
        const contact = formData.get('contact');

        try {
            if (mode === 'signin') {
                const res = await loginAction(email, password);
                if (res.success) {
                    const loggedInUser = res.user;
                    if (!loggedInUser.isEmailVerified) {
                        setMode('verify-email');
                        setTimer(60);
                    } else if (!loggedInUser.isPhoneVerified) {
                        setMode('verify-phone');
                        setTimer(60);
                    } else {
                        onClose();
                    }
                }
            } else if (mode === 'signup') {
                const res = await registerAction(name, email, contact, password);
                if (res.success) {
                    const loggedInUser = res.user;
                    if (!loggedInUser.isEmailVerified) {
                        setMode('verify-email');
                        setTimer(60);
                    } else if (!loggedInUser.isPhoneVerified) {
                        setMode('verify-phone');
                        setTimer(60);
                    } else {
                        onClose();
                    }
                }
            }
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        const otpString = otpDigits.join('');
        if (otpString.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setError('');
        setSuccessMessage('');
        try {
            if (mode === 'verify-email') {
                await verifyEmailAction(otpString);
                setSuccessMessage('Email verified successfully!');
                setOtpDigits(['', '', '', '', '', '']);

                // If phone also needs verification, transition to phone verify
                if (user && !user.isPhoneVerified) {
                    setTimeout(() => {
                        setSuccessMessage('');
                        setMode('verify-phone');
                        setTimer(60);
                    }, 1500);
                } else {
                    setTimeout(() => {
                        onClose();
                    }, 1500);
                }
            } else if (mode === 'verify-phone') {
                await verifyPhoneAction(otpString);
                setSuccessMessage('Phone number verified successfully!');
                setTimeout(() => {
                    onClose();
                }, 1500);
            }
        } catch (err) {
            setError(err.message || 'Verification failed. Please check the code.');
        }
    };

    const handleResendOtp = async () => {
        if (timer > 0) return;
        setError('');
        setSuccessMessage('');
        try {
            if (mode === 'verify-email') {
                await resendEmailOtpAction();
                setSuccessMessage('A new Email OTP has been sent!');
            } else {
                await resendPhoneOtpAction();
                setSuccessMessage('A new Phone OTP has been sent!');
            }
            setTimer(60);
            setOtpDigits(['', '', '', '', '', '']);
            otpInputsRef.current[0]?.focus();
        } catch (err) {
            setError(err.message || 'Failed to resend verification code');
        }
    };

    const handleCancelVerification = () => {
        logout();
        setMode('signin');
        setError('');
        setSuccessMessage('');
    };

    const handleOtpChange = (index, value) => {
        // Only allow a single digit
        if (value && !/^\d$/.test(value)) return;

        const newDigits = [...otpDigits];
        newDigits[index] = value;
        setOtpDigits(newDigits);

        // Auto tabbing to the next input
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
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();
        if (/^\d{6}$/.test(pastedData)) {
            const newDigits = pastedData.split('');
            setOtpDigits(newDigits);
            otpInputsRef.current[5]?.focus();
        }
    };

    const toggleMode = () => {
        setMode(prev => prev === 'signin' ? 'signup' : 'signin');
        setError('');
        setSuccessMessage('');
    };

    const renderVerificationView = () => {
        const isEmail = mode === 'verify-email';
        const target = isEmail ? user?.email : user?.phone;

        return (
            <div className="auth-verification-view">
                <h2 className="auth-title">
                    {isEmail ? 'Verify Your Email' : 'Verify Your Phone'}
                </h2>

                <p className="auth-subtitle">
                    Enter the 6-digit OTP code sent to <br />
                    <span className="auth-target-highlight">{target || 'your registered contact'}</span>
                </p>

                {error && <div className="auth-error-banner">{error}</div>}
                {successMessage && <div className="auth-success-banner">{successMessage}</div>}

                <form onSubmit={handleVerifyOtp} className="auth-form">
                    <div className="otp-container">
                        {otpDigits.map((digit, idx) => (
                            <input
                                key={idx}
                                ref={el => otpInputsRef.current[idx] = el}
                                type="text"
                                maxLength={1}
                                value={digit}
                                onChange={e => handleOtpChange(idx, e.target.value)}
                                onKeyDown={e => handleOtpKeyDown(idx, e)}
                                onPaste={handleOtpPaste}
                                className="otp-digit-input"
                                pattern="\d*"
                                inputMode="numeric"
                                disabled={isLoading}
                                required
                            />
                        ))}
                    </div>

                    <button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={isLoading || otpDigits.join('').length !== 6}
                    >
                        {isLoading ? 'Verifying...' : 'Verify & Continue'}
                    </button>
                </form>

                <div className="auth-otp-actions">
                    {timer > 0 ? (
                        <p className="auth-timer-text">Resend code in <strong>{timer}s</strong></p>
                    ) : (
                        <button
                            type="button"
                            className="auth-link-btn resend-btn"
                            onClick={handleResendOtp}
                            disabled={isLoading}
                        >
                            Resend Verification Code
                        </button>
                    )}
                </div>

                <div className="auth-cancel-action">
                    <button
                        type="button"
                        className="auth-cancel-btn"
                        onClick={handleCancelVerification}
                        disabled={isLoading}
                    >
                        Cancel & Sign Out
                    </button>
                </div>
            </div>
        );
    };

    const renderFormView = () => {
        return (
            <>
                <h2 className="auth-title">
                    {mode === 'signin' ? 'Welcome Back' : 'Create an Account'}
                </h2>

                <p className="auth-subtitle">
                    {mode === 'signin'
                        ? 'Sign in to access your saved pets and posts.'
                        : 'Join StrayCare to start helping animals today.'}
                </p>

                {error && <div className="auth-error-banner">{error}</div>}
                {successMessage && <div className="auth-success-banner">{successMessage}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    {mode === 'signup' && (
                        <div className="auth-form-group">
                            <label>Full Name</label>
                            <input name="name" type="text" placeholder="John Doe" disabled={isLoading} required />
                        </div>
                    )}

                    {mode === 'signup' && (
                        <div className="auth-form-group">
                            <label>Contact Number</label>
                            <input name="contact" type="tel" placeholder="1234567890" minLength={10} maxLength={10} disabled={isLoading} required />
                        </div>
                    )}

                    <div className="auth-form-group">
                        <label>Email</label>
                        <input name="email" type="email" placeholder="john@example.com" disabled={isLoading} required />
                    </div>


                    <div className="auth-form-group">
                        <label>Password</label>
                        <input name="password" type="password" placeholder="••••••••" disabled={isLoading} required />
                        {mode === 'signup' && (
                            <small className="auth-hint" style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px', display: 'block' }}>
                                Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a digit, and a special character.
                            </small>
                        )}
                    </div>

                    <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                        {isLoading ? 'Processing...' : (mode === 'signin' ? 'Sign In' : 'Sign Up')}
                    </button>
                </form>

                <div className="auth-toggle">
                    {mode === 'signin' ? (
                        <p>Don't have an account? <button className="auth-link-btn" onClick={toggleMode} disabled={isLoading}>Sign up</button></p>
                    ) : (
                        <p>Already have an account? <button className="auth-link-btn" onClick={toggleMode} disabled={isLoading}>Sign in</button></p>
                    )}
                </div>
                <div className="auth-divider">
                    <p>Register with us <button className="auth-link-btn" onClick={() => { handleClose(); navigate('/register'); }} disabled={isLoading}>Join us </button></p>
                </div>
            </>
        );
    };

    return (
        <div className="auth-modal-overlay" onClick={handleClose}>
            <div className="auth-modal-content" onClick={e => e.stopPropagation()}>
                <button className="auth-close-btn" onClick={handleClose}>&times;</button>

                {(mode === 'verify-email' || mode === 'verify-phone')
                    ? renderVerificationView()
                    : renderFormView()}
            </div>
        </div>
    );
};

export default AuthModal;

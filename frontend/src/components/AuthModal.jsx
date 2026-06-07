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
        resendEmailOtpAction,
        forgotPasswordAction,
        resetPasswordAction,
        logout
    } = useAuthStore();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');

    // Reset mode and states when opened/initialMode changes
    useEffect(() => {
        if (isOpen) {
            setMode(initialMode);
            setError('');
            setSuccessMessage('');
            setOtpDigits(['', '', '', '', '', '']);
            setShowPassword(false);
            setForgotEmail('');
            if (initialMode === 'verify-email') {
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
        if (isLoggedIn && user && !user.isEmailVerified) {
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
            if (mode === 'forgot-password') {
                setForgotEmail(email);
                const res = await forgotPasswordAction(email);
                if (res.success) {
                    setSuccessMessage('A password reset code has been sent to your email.');
                    setTimeout(() => {
                        setMode('reset-password');
                        setSuccessMessage('');
                        setTimer(60);
                        setOtpDigits(['', '', '', '', '', '']);
                    }, 1500);
                }
            } else if (mode === 'signin') {
                const res = await loginAction(email, password);
                if (res.success) {
                    const loggedInUser = res.user;
                    if (!loggedInUser.isEmailVerified) {
                        setMode('verify-email');
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
        const target = user?.email;

        return (
            <div className="auth-verification-view">
                <h2 className="auth-title">
                    Verify Your Email
                </h2>

                <p className="auth-subtitle">
                    Enter the 6-digit OTP code sent to <br />
                    <span className="auth-target-highlight">{target || 'your registered email'}</span>
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

    const handleResetPassword = async (e) => {
        e.preventDefault();
        const otpString = otpDigits.join('');
        if (otpString.length !== 6) {
            setError('Please enter all 6 digits of the code');
            return;
        }
        const formData = new FormData(e.currentTarget);
        const newPassword = formData.get('newPassword');
        if (!newPassword) {
            setError('Please enter a new password');
            return;
        }

        setError('');
        setSuccessMessage('');
        try {
            const res = await resetPasswordAction(forgotEmail, otpString, newPassword);
            if (res.success) {
                setSuccessMessage('Password has been reset successfully! Redirecting to sign in...');
                setTimeout(() => {
                    setMode('signin');
                    setError('');
                    setSuccessMessage('');
                    setOtpDigits(['', '', '', '', '', '']);
                    setShowPassword(false);
                }, 2000);
            }
        } catch (err) {
            setError(err.message || 'Failed to reset password');
        }
    };

    const renderForgotPasswordView = () => {
        return (
            <>
                <h2 className="auth-title">Forgot Password</h2>
                <p className="auth-subtitle">
                    Enter your registered email address to receive a password reset code.
                </p>

                {error && <div className="auth-error-banner">{error}</div>}
                {successMessage && <div className="auth-success-banner">{successMessage}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-form-group">
                        <label>Email</label>
                        <input name="email" type="email" placeholder="john@example.com" disabled={isLoading} required />
                    </div>

                    <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                        {isLoading ? 'Sending...' : 'Send Reset Code'}
                    </button>
                </form>

                <div className="auth-toggle">
                    <button className="auth-link-btn" onClick={() => { setMode('signin'); setError(''); setSuccessMessage(''); }} disabled={isLoading} style={{ textDecoration: 'none' }}>
                        Back to Sign In
                    </button>
                </div>
            </>
        );
    };

    const renderResetPasswordView = () => {
        return (
            <>
                <h2 className="auth-title">Reset Password</h2>
                <p className="auth-subtitle">
                    Enter the 6-digit code sent to <strong style={{ color: '#346c02' }}>{forgotEmail}</strong> and your new password.
                </p>

                {error && <div className="auth-error-banner">{error}</div>}
                {successMessage && <div className="auth-success-banner">{successMessage}</div>}

                <form className="auth-form" onSubmit={handleResetPassword}>
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

                    <div className="auth-form-group" style={{ marginTop: '20px' }}>
                        <label>New Password</label>
                        <div className="password-input-wrapper">
                            <input
                                name="newPassword"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                disabled={isLoading}
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
                        <small className="auth-hint" style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px', display: 'block' }}>
                            Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a digit, and a special character.
                        </small>
                    </div>

                    <button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>

                <div className="auth-otp-actions">
                    {timer > 0 ? (
                        <p className="auth-timer-text">Resend code in <strong>{timer}s</strong></p>
                    ) : (
                        <button
                            type="button"
                            className="auth-link-btn resend-btn"
                            onClick={async () => {
                                setError('');
                                setSuccessMessage('');
                                try {
                                    await forgotPasswordAction(forgotEmail);
                                    setSuccessMessage('A new reset code has been sent!');
                                    setTimer(60);
                                    setOtpDigits(['', '', '', '', '', '']);
                                    otpInputsRef.current[0]?.focus();
                                } catch (err) {
                                    setError(err.message || 'Failed to resend code');
                                }
                            }}
                            disabled={isLoading}
                        >
                            Resend Reset Code
                        </button>
                    )}
                </div>

                <div className="auth-cancel-action">
                    <button
                        type="button"
                        className="auth-cancel-btn"
                        onClick={() => { setMode('signin'); setError(''); setSuccessMessage(''); }}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                </div>
            </>
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
                        <div className="auth-password-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label style={{ margin: 0 }}>Password</label>
                            {mode === 'signin' && (
                                <button
                                    type="button"
                                    className="auth-link-btn forgot-password-link"
                                    onClick={() => { setMode('forgot-password'); setError(''); setSuccessMessage(''); }}
                                    style={{ fontSize: '0.8rem', textDecoration: 'none' }}
                                    disabled={isLoading}
                                >
                                    Forgot Password?
                                </button>
                            )}
                        </div>
                        <div className="password-input-wrapper">
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                disabled={isLoading}
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

                {mode === 'verify-email' && renderVerificationView()}
                {(mode === 'signin' || mode === 'signup') && renderFormView()}
                {mode === 'forgot-password' && renderForgotPasswordView()}
                {mode === 'reset-password' && renderResetPasswordView()}
            </div>
        </div>
    );
};

export default AuthModal;

import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import '../../styles/AuthModal.css';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import bgImage from '../../assets/images/happy_animals_bg.webp';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { loginAction, user, logout, isLoading } = useAuthStore();
    const navigate = useNavigate();

    const isUnauthorized = user && !['ADMIN', 'admin'].includes(user.role);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        try {
            const result = await loginAction(email, password);
            if (result.success) {
                const userRole = result.user?.role?.toUpperCase();
                if (userRole !== 'ADMIN') {
                    setErrorMsg('Access Denied: Your account is not authorized for the Admin Portal.');
                    logout();
                    return;
                }
                alert('Admin Login successful!');
                navigate('/admin');
            }
        } catch (error) {
            setErrorMsg(error.message || 'Login failed. Please check credentials.');
        }
    };

    return (
        <>
            <Helmet>
                <title>Furzo Admin - Login</title>
                <meta name="description" content="Restricted access portal for Furzo system administrators." />
            </Helmet>
            <div className="admin-login-page" style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                fontFamily: "'Outfit', sans-serif"
            }}>
                {/* Background Image with Blur */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `url(${bgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(8px)',
                    transform: 'scale(1.1)', // Prevents white edges from blur
                    zIndex: 0
                }} />

                {/* Dark Overlay for better contrast */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255, 255, 255, 0.11)',
                    zIndex: 1
                }} />

                <div className="auth-modal-content" style={{
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    maxWidth: '450px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    position: 'relative',
                    zIndex: 2,
                    backdropFilter: 'blur(10px)'
                }}>
                    <h2 className="auth-title" style={{ color: '#333' }}>Admin Portal</h2>
                    <p className="auth-subtitle">Restricted access for system administrators.</p>

                    {(isUnauthorized || errorMsg) && (
                        <div style={{
                            background: '#fff4f4',
                            border: '1px solid #ffcdd2',
                            padding: '15px',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            fontSize: '0.85rem',
                            color: '#b71c1c'
                        }}>
                            <strong>{errorMsg ? 'Login Error:' : 'Access Denied:'}</strong> {errorMsg || <>Your account (<em>{user?.email}</em>) is not authorized for the Admin Portal.</>}
                            {(isUnauthorized || user) && (
                                <button
                                    onClick={logout}
                                    style={{
                                        display: 'block',
                                        marginTop: '10px',
                                        background: '#b71c1c',
                                        color: 'white',
                                        border: 'none',
                                        padding: '5px 10px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem'
                                    }}
                                >
                                    Log Out to Switch Account
                                </button>
                            )}
                        </div>
                    )}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="auth-form-group">
                            <label>Admin Email</label>
                            <input
                                type="email"
                                placeholder="admin@straycare.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="auth-form-group">
                            <label>Password</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
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

                        <button type="submit" disabled={isLoading} className="auth-submit-btn" style={{ background: '#000000ff', color: 'white' }}>
                            {isLoading ? 'SIGNING IN...' : 'SIGN IN AS ADMIN'}
                        </button>

                        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#888', marginTop: '20px' }}>
                            Unauthorized access is monitored and logged.
                        </p>
                    </form>
                </div>
            </div>
        </>
    );
};

export default AdminLogin;

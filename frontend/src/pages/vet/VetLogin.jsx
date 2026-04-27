import React, { useState } from 'react';
import '../../styles/AuthModal.css';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import bgImage from '../../assets/images/happy_animals_bg.png';

const VetLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, user, logout } = useAuth();
    const navigate = useNavigate();

    const isUnauthorized = user && !['VET', 'CLINIC', 'NGO', 'vet', 'clinic', 'ngo'].includes(user.role);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Mocking Vet authentication
        const userData = {
            name: 'Dr. John Doe',
            email: email,
            role: 'VET' // Explicitly setting role to VET for this portal
        };

        login(userData);
        alert('Vet Login successful!');
        navigate('/vet/dashboard');
    };

    return (
        <div className="vet-login-page" style={{ 
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
            
            {/* Overlay for better contrast */}
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
                boxShadow: '0 20px 60px rgba(0,0,0,0.1)', 
                maxWidth: '450px',
                background: 'rgba(255, 255, 255, 0.95)',
                position: 'relative',
                zIndex: 2,
                backdropFilter: 'blur(10px)'
            }}>
                <h2 className="auth-title">Vet Portal</h2>
                <p className="auth-subtitle">Login for clinics & veterinarians.</p>

                {isUnauthorized && (
                    <div style={{ 
                        background: '#fff4f4', 
                        border: '1px solid #ffcdd2', 
                        padding: '15px', 
                        borderRadius: '8px', 
                        marginBottom: '20px',
                        fontSize: '0.85rem',
                        color: '#b71c1c'
                    }}>
                        <strong>Access Denied:</strong> Your account (<em>{user.email}</em>) is not authorized for the Vet Portal. Please log in with a professional account.
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
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-form-group">
                        <label>Email Address</label>
                        <input 
                            type="email" 
                            placeholder="clinic@straycare.com" 
                            required 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="auth-form-group">
                        <label>Password</label>
                        <input 
                            type="password" 
                            placeholder="••••••••" 
                            required 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="auth-submit-btn" style={{ background: '#ffd21e' }}>
                        SIGN IN AS VET
                    </button>
                    
                    <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#888', marginTop: '20px' }}>
                        Need a vet account? <a href="/register" style={{ color: '#333', fontWeight: '600' }}>Apply here</a>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default VetLogin;

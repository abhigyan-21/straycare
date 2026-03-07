import React, { useState, useEffect } from 'react';
import '../styles/AuthModal.css';
import { useAuth } from '../context/AuthContext';

const AuthModal = ({ isOpen, onClose, initialMode = 'signin' }) => {
    const [mode, setMode] = useState(initialMode);
    const { login } = useAuth();

    // Reset mode when opened with a new initialMode
    useEffect(() => {
        if (isOpen) {
            setMode(initialMode);
        }
    }, [isOpen, initialMode]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        // In a real app, this would handle authentication
        const userData = {
            name: mode === 'signup' ? e.target[0].value : 'StrayCare User',
            email: mode === 'signup' ? e.target[1].value : e.target[0].value
        };

        login(userData);
        alert(`${mode === 'signin' ? 'Sign In' : 'Sign Up'} successful!`);
        onClose();
    };


    const toggleMode = () => {
        setMode(prev => prev === 'signin' ? 'signup' : 'signin');
    };

    return (
        <div className="auth-modal-overlay" onClick={onClose}>
            <div className="auth-modal-content" onClick={e => e.stopPropagation()}>
                <button className="auth-close-btn" onClick={onClose}>&times;</button>

                <h2 className="auth-title">
                    {mode === 'signin' ? 'Welcome Back' : 'Create an Account'}
                </h2>

                <p className="auth-subtitle">
                    {mode === 'signin'
                        ? 'Sign in to access your saved pets and posts.'
                        : 'Join StrayCare to start helping animals today.'}
                </p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {mode === 'signup' && (
                        <div className="auth-form-group">
                            <label>Full Name</label>
                            <input type="text" placeholder="John Doe" required />
                        </div>
                    )}

                    <div className="auth-form-group">
                        <label>Email</label>
                        <input type="email" placeholder="john@example.com" required />
                    </div>

                    <div className="auth-form-group">
                        <label>Password</label>
                        <input type="password" placeholder="••••••••" required />
                    </div>

                    <button type="submit" className="auth-submit-btn">
                        {mode === 'signin' ? 'Sign In' : 'Sign Up'}
                    </button>
                </form>

                <div className="auth-toggle">
                    {mode === 'signin' ? (
                        <p>Don't have an account? <button className="auth-link-btn" onClick={toggleMode}>Sign up</button></p>
                    ) : (
                        <p>Already have an account? <button className="auth-link-btn" onClick={toggleMode}>Sign in</button></p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthModal;

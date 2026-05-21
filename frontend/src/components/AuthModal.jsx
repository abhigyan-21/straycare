import React, { useState, useEffect } from 'react';
import '../styles/AuthModal.css';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const AuthModal = ({ isOpen, onClose, initialMode = 'signin' }) => {
    const [mode, setMode] = useState(initialMode);
    const { login } = useAuthStore();
    const navigate = useNavigate();

    // Reset mode when opened with a new initialMode
    useEffect(() => {
        if (isOpen) {
            setMode(initialMode);
        }
    }, [isOpen, initialMode]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const email = formData.get('email');
        const password = formData.get('password');
        const name = formData.get('name');
        const contact = formData.get('contact');

        // Special mock credentials for testing
        let role = 'USER';
        if (email === '12@g.com' && password === '1234') {
            role = 'RESCUER';
        }

        const userData = {
            name: mode === 'signup' ? name : (email === '12@g.com' ? 'Test Rescuer' : 'StrayCare User'),
            email: email,
            contact: contact,
            role: role
        };

        login(userData);
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
                            <input name="name" type="text" placeholder="John Doe" required />
                        </div>
                    )}

                    {mode === 'signup' && (
                        <div className="auth-form-group">
                            <label>Contact Number</label>
                            <input name="contact" type="tel" placeholder="1234567890" minLength={10} maxLength={10} required />
                        </div>
                    )}

                    <div className="auth-form-group">
                        <label>Email</label>
                        <input name="email" type="email" placeholder="john@example.com" defaultValue="12@g.com" required />
                    </div>

                    <div className="auth-form-group">
                        <label>Password</label>
                        <input name="password" type="password" placeholder="••••••••" defaultValue="1234" required />
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
                <div className="auth-divider">
                    <p>Register with us <button className="auth-link-btn" onClick={() => { onClose(); navigate('/register'); }}>Join us </button></p>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;

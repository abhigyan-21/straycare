import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuthStore } from '../../store/authStore';
import { Lock, Eye, EyeOff, Save, ShieldAlert, CheckCircle, Info } from 'lucide-react';

const AdminSettings = () => {
    const { changePasswordAction, isLoading } = useAuthStore();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // Visibility toggles
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Messages
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Password criteria check states
    const [criteria, setCriteria] = useState({
        length: false,
        upperLower: false,
        numberSpecial: false
    });

    useEffect(() => {
        setCriteria({
            length: newPassword.length >= 8,
            upperLower: /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword),
            numberSpecial: /\d/.test(newPassword) && /[\W_]/.test(newPassword)
        });
    }, [newPassword]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMessage('');
        setErrorMessage('');

        if (!currentPassword || !newPassword || !confirmPassword) {
            setErrorMessage('All fields are required.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMessage('New passwords do not match.');
            return;
        }

        // Validate password strength
        const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        if (!passwordStrengthRegex.test(newPassword)) {
            setErrorMessage('Password does not meet the safety requirements.');
            return;
        }

        try {
            const res = await changePasswordAction(currentPassword, newPassword);
            if (res.success) {
                setSuccessMessage(res.message || 'Password changed successfully!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch (error) {
            setErrorMessage(error.message || 'Failed to change password. Please check your current password.');
        }
    };

    return (
        <>
        <Helmet>
            <title>Furzo Admin - Settings</title>
            <meta name="description" content="Manage Furzo admin security settings and update administrative credentials." />
        </Helmet>
        <div className="admin-settings-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="admin-page-header">
                <div>
                    <h2 className="admin-page-title">Admin Settings</h2>
                    <p className="admin-page-subtitle">Manage administrative options and security credentials</p>
                </div>
            </div>

            <div className="admin-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div className="admin-stat-icon green" style={{ width: '48px', height: '48px', borderRadius: '14px' }}>
                        <Lock size={22} />
                    </div>
                    <div>
                        <h3 className="admin-card-title" style={{ margin: 0 }}>Security Credentials</h3>
                        <p className="admin-card-subtitle" style={{ margin: 0 }}>Update your administrative login password</p>
                    </div>
                </div>

                {successMessage && (
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        padding: '16px', 
                        borderRadius: '16px', 
                        backgroundColor: 'var(--admin-accent-soft)', 
                        border: '1px solid var(--admin-accent-border)', 
                        color: 'var(--admin-accent)',
                        marginBottom: '24px',
                        animation: 'fadeIn 0.3s ease'
                    }}>
                        <CheckCircle size={20} />
                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{successMessage}</span>
                    </div>
                )}

                {errorMessage && (
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        padding: '16px', 
                        borderRadius: '16px', 
                        backgroundColor: 'var(--admin-danger-soft)', 
                        border: '1px solid rgba(224, 100, 92, 0.15)', 
                        color: 'var(--admin-danger)',
                        marginBottom: '24px',
                        animation: 'fadeIn 0.3s ease'
                    }}>
                        <ShieldAlert size={20} />
                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{errorMessage}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Current Password */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--admin-text)' }}>Current Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showCurrent ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current admin password"
                                required
                                style={{
                                    width: '100%',
                                    padding: '14px 48px 14px 16px',
                                    borderRadius: '16px',
                                    border: '1px solid var(--admin-glass-border)',
                                    background: 'rgba(255, 255, 255, 0.8)',
                                    fontSize: '0.95rem',
                                    boxSizing: 'border-box'
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent(!showCurrent)}
                                style={{
                                    position: 'absolute',
                                    right: '16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--admin-text-light)',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* New Password */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--admin-text)' }}>New Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showNew ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter strong new password"
                                required
                                style={{
                                    width: '100%',
                                    padding: '14px 48px 14px 16px',
                                    borderRadius: '16px',
                                    border: '1px solid var(--admin-glass-border)',
                                    background: 'rgba(255, 255, 255, 0.8)',
                                    fontSize: '0.95rem',
                                    boxSizing: 'border-box'
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(!showNew)}
                                style={{
                                    position: 'absolute',
                                    right: '16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--admin-text-light)',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {/* Interactive Password Criteria checklist */}
                        <div style={{ 
                            marginTop: '10px', 
                            padding: '16px', 
                            borderRadius: '16px', 
                            background: 'rgba(0, 0, 0, 0.02)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            fontSize: '0.85rem',
                            color: 'var(--admin-text-light)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, marginBottom: '4px' }}>
                                <Info size={14} /> Password Requirements:
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: criteria.length ? 'var(--admin-accent)' : '' }}>
                                <div style={{ 
                                    width: '6px', 
                                    height: '6px', 
                                    borderRadius: '50%', 
                                    backgroundColor: criteria.length ? 'var(--admin-accent)' : '#94a3b8' 
                                }} />
                                <span>At least 8 characters long</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: criteria.upperLower ? 'var(--admin-accent)' : '' }}>
                                <div style={{ 
                                    width: '6px', 
                                    height: '6px', 
                                    borderRadius: '50%', 
                                    backgroundColor: criteria.upperLower ? 'var(--admin-accent)' : '#94a3b8' 
                                }} />
                                <span>Contains both uppercase and lowercase letters</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: criteria.numberSpecial ? 'var(--admin-accent)' : '' }}>
                                <div style={{ 
                                    width: '6px', 
                                    height: '6px', 
                                    borderRadius: '50%', 
                                    backgroundColor: criteria.numberSpecial ? 'var(--admin-accent)' : '#94a3b8' 
                                }} />
                                <span>Contains at least one number and one special character (e.g. @, !, #)</span>
                            </div>
                        </div>
                    </div>

                    {/* Confirm New Password */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--admin-text)' }}>Confirm New Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter new password to confirm"
                                required
                                style={{
                                    width: '100%',
                                    padding: '14px 48px 14px 16px',
                                    borderRadius: '16px',
                                    border: '1px solid var(--admin-glass-border)',
                                    background: 'rgba(255, 255, 255, 0.8)',
                                    fontSize: '0.95rem',
                                    boxSizing: 'border-box'
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                style={{
                                    position: 'absolute',
                                    right: '16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--admin-text-light)',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {confirmPassword && newPassword !== confirmPassword && (
                            <span style={{ color: 'var(--admin-danger)', fontSize: '0.8rem', fontWeight: 600, marginTop: '4px' }}>
                                Passwords do not match
                            </span>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        className="admin-btn-primary" 
                        disabled={isLoading || !criteria.length || !criteria.upperLower || !criteria.numberSpecial || newPassword !== confirmPassword}
                        style={{ 
                            alignSelf: 'flex-start', 
                            padding: '14px 28px',
                            opacity: (isLoading || !criteria.length || !criteria.upperLower || !criteria.numberSpecial || newPassword !== confirmPassword) ? 0.6 : 1,
                            cursor: (isLoading || !criteria.length || !criteria.upperLower || !criteria.numberSpecial || newPassword !== confirmPassword) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <Save size={18} />
                        {isLoading ? 'Updating...' : 'Save Password'}
                    </button>
                </form>
            </div>
        </div>
        </>
    );
};

export default AdminSettings;

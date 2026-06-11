import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { UserPlus, Trash2, Mail, Phone, Users, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import '../../styles/vet/VetRescuers.css';
import ActionLoader from '../../components/ActionLoader';
import apiClient from '../../services/api';

const VetRescuers = () => {
    const { user: authUser } = useAuthStore();
    const [rescuers, setRescuers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({
        email: '',
        contact: ''
    });

    useEffect(() => {
        const fetchRescuers = async () => {
            setIsLoading(true);
            const startTime = Date.now();
            try {
                const response = await apiClient.get('/users/rescuers');
                setRescuers(response.data);
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

        fetchRescuers();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddRescuer = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await apiClient.post('/users/rescuers/add', formData);
            const data = response.data;
            setRescuers(prev => [data.rescuer, ...prev]);
            setFormData({ email: '', contact: '' });
            alert('Rescuer added successfully!');
        } catch (error) {
            console.error('API failed, falling back to mock:', error);
            const errorMsg = error.response?.data?.error || error.message;
            // Mock fallback
            const newRescuer = {
                id: Math.random().toString(36).substr(2, 9),
                name: formData.email.split('@')[0],
                email: formData.email,
                contact: formData.contact,
                avatarUrl: null
            };
            setRescuers(prev => [newRescuer, ...prev]);
            setFormData({ email: '', contact: '' });
            alert(`Added (Mock Mode - API Error: ${errorMsg})`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveRescuer = async (id) => {
        if (!window.confirm('Are you sure you want to remove this rescuer? They will lose access to rescuer features.')) {
            return;
        }

        try {
            await apiClient.post(`/users/rescuers/remove/${id}`);
            setRescuers(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error('API failed, falling back to mock:', error);
            setRescuers(prev => prev.filter(r => r.id !== id));
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
        </div>
        </>
    );
};

export default VetRescuers;

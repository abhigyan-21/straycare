import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Mail, Phone, Users, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/vet/VetRescuers.css';

const VetRescuers = () => {
    const { user: authUser } = useAuth();
    const [rescuers, setRescuers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({
        email: '',
        contact: ''
    });

    // Mock data for initial state
    const MOCK_RESCUERS = [
        { id: '1', name: 'Rahul Sharma', email: 'rahul@example.com', contact: '+91 98765 43210', avatarUrl: null },
        { id: '2', name: 'Sneha Patel', email: 'sneha@example.com', contact: '+91 99887 76655', avatarUrl: null },
    ];

    useEffect(() => {
        // In a real app, fetch from API: GET /api/users/rescuers
        const fetchRescuers = async () => {
            setIsLoading(true);
            try {
                // Simulating API call delay
                await new Promise(resolve => setTimeout(resolve, 800));
                setRescuers(MOCK_RESCUERS);
            } catch (error) {
                console.error("Failed to fetch rescuers", error);
            } finally {
                setIsLoading(false);
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
            // In a real app, call API: POST /api/users/rescuers/add
            // { email: formData.email, contact: formData.contact }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Simulating a successful promotion
            const newRescuer = {
                id: Math.random().toString(36).substr(2, 9),
                name: formData.email.split('@')[0], // Mock name from email
                email: formData.email,
                contact: formData.contact,
                avatarUrl: null
            };

            setRescuers(prev => [newRescuer, ...prev]);
            setFormData({ email: '', contact: '' });
            alert('Rescuer added successfully!');
        } catch (error) {
            alert('Failed to add rescuer. Make sure the user exists.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveRescuer = async (id) => {
        if (!window.confirm('Are you sure you want to remove this rescuer? They will lose access to rescuer features.')) {
            return;
        }

        try {
            // In a real app, call API: POST /api/users/rescuers/remove/:id
            await new Promise(resolve => setTimeout(resolve, 500));
            setRescuers(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            alert('Failed to remove rescuer.');
        }
    };

    return (
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
                    <div className="empty-state">
                        <p>Loading rescuers...</p>
                    </div>
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
    );
};

export default VetRescuers;

import React, { useState } from 'react';
import { X, Upload, Info, Heart, Calendar, Hash } from 'lucide-react';

const CreateAdoptionModal = ({ isOpen, onClose, onPublish }) => {
    const [formData, setFormData] = useState({
        name: '',
        species: 'Dog',
        breed: '',
        age: '',
        gender: 'Male',
        description: '',
        healthStatus: '',
        image: null
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onPublish(formData);
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content create-adoption-modal">
                <div className="modal-header">
                    <div className="header-title">
                        <Heart className="header-icon" size={24} />
                        <h2>Create Adoption Post</h2>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="adoption-form">
                    <div className="form-grid">
                        <div className="form-section main-info">
                            <div className="input-group">
                                <label>Pet Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="e.g. Buddy"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="input-row">
                                <div className="input-group">
                                    <label>Species</label>
                                    <select name="species" value={formData.species} onChange={handleChange}>
                                        <option value="Dog">Dog</option>
                                        <option value="Cat">Cat</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Gender</label>
                                    <select name="gender" value={formData.gender} onChange={handleChange}>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                            </div>

                            <div className="input-row">
                                <div className="input-group">
                                    <label>Age</label>
                                    <input
                                        type="text"
                                        name="age"
                                        placeholder="e.g. 2 years"
                                        value={formData.age}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="input-row">
                                <div className="input-group">
                                    <label>Breed</label>
                                    <input
                                        type="text"
                                        name="breed"
                                        placeholder="e.g. Golden Retriever"
                                        value={formData.breed}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-section media-info">
                            <div className="image-upload-container">
                                <label>Pet Photo</label>
                                <div className="upload-box">
                                    <Upload size={32} />
                                    <span>Click to upload photo</span>
                                    <input type="file" className="file-input" accept="image/*" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-bottom-section">
                        <div className="input-group">
                            <label>Hobbies</label>
                            <input
                                type="text"
                                name="hobbies"
                                placeholder="e.g. Playing, Sleeping"
                                value={formData.hobbies}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="input-row">
                            <div className="input-group">
                                <label>Talents</label>
                                <input
                                    type="text"
                                    name="talents"
                                    placeholder="e.g. Playing, Sleeping"
                                    value={formData.talents}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="input-group">
                                <label>Health & Vaccination Status</label>
                                <input
                                    type="text"
                                    name="healthStatus"
                                    placeholder="e.g. Fully vaccinated, Neutered"
                                    value={formData.healthStatus}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                    </div>
                    <div className="modal-actions">
                        <button type="submit" className="confirm-btn">Publish Adoption</button>
                        <button type="button" className="cancel-btn" onClick={onClose}>Discard</button>
                    </div>
                </form>
            </div>
        </div>  
    );
};

export default CreateAdoptionModal;

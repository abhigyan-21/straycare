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
        hobbies: '',
        talents: '',
        image: null
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const validExtensions = ['jpeg', 'jpg', 'png'];
            const fileExtension = file.name.split('.').pop().toLowerCase();
            const validMimeTypes = ['image/jpeg', 'image/png'];
            const fileMime = file.type;

            if (!validExtensions.includes(fileExtension) || (fileMime && !validMimeTypes.includes(fileMime))) {
                alert('Only JPEG, JPG, and PNG images are accepted.');
                e.target.value = ''; // Reset file input
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, image: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleClose = () => {
        setFormData({
            name: '',
            species: 'Dog',
            breed: '',
            age: '',
            gender: 'Male',
            description: '',
            healthStatus: '',
            hobbies: '',
            talents: '',
            image: null
        });
        onClose();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.image) {
            alert('Please upload a pet photo.');
            return;
        }
        onPublish(formData);
        handleClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content create-adoption-modal">
                <div className="modal-header">
                    <div className="header-title">
                        <Heart className="header-icon" size={24} />
                        <h2>Create Adoption Post</h2>
                    </div>
                    <button className="close-btn" onClick={handleClose}>
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
                                    <select name="species" value={formData.species} onChange={handleChange} required>
                                        <option value="Dog">Dog</option>
                                        <option value="Cat">Cat</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Gender</label>
                                    <select name="gender" value={formData.gender} onChange={handleChange} required>
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
                                        required
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
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-section media-info">
                            <div className="image-upload-container" style={{ height: '100%' }}>
                                <label>Pet Photo</label>
                                <div className="upload-box" style={{ height: 'calc(100% - 35px)', minHeight: '220px' }}>
                                    {formData.image ? (
                                        <img 
                                            src={formData.image} 
                                            alt="Preview" 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '18px' }} 
                                        />
                                    ) : (
                                        <>
                                            <Upload size={32} />
                                            <span>Click to upload photo</span>
                                        </>
                                    )}
                                    <input 
                                        type="file" 
                                        className="file-input" 
                                        accept=".jpeg,.jpg,.png,image/jpeg,image/png" 
                                        onChange={handleFileChange}
                                        required
                                    />
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
                                    required
                                />
                            </div>
                        </div>

                    </div>
                    <div className="modal-actions">
                        <button type="submit" className="confirm-btn">Publish Adoption</button>
                        <button type="button" className="cancel-btn" onClick={handleClose}>Discard</button>
                    </div>
                </form>
            </div>
        </div>  
    );
};

export default CreateAdoptionModal;

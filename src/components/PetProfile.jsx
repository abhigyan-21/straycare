import React from 'react';

const PetProfile = ({ pet, onInterested, isInterested }) => {
    if (!pet) {
        return (
            <div className="pet-profile-card">
                <p>Select a pet to view its profile.</p>
            </div>
        );
    }

    return (
        <div className="pet-profile-card">
            <h2 className="profile-title">Profile</h2>
            <div className="profile-details">
                <div className="detail-row">
                    <span className="label">Name:</span> <span className="value">{pet.name}</span>
                </div>
                <div className="detail-row">
                    <span className="label">Breed:</span> <span className="value">{pet.breed}</span>
                </div>
                <div className="detail-row">
                    <span className="label">Age:</span> <span className="value">{pet.age}</span>
                </div>
                <div className="detail-row">
                    <span className="label">Sex:</span> <span className="value">{pet.sex}</span>
                </div>

                <div className="detail-row span-full mt-2">
                    <span className="label block">Medical history:</span>
                    <span className="value block">{pet.medicalHistory}</span>
                </div>

                <div className="detail-row span-full mt-2">
                    <span className="label block">Hobbies:</span>
                    <span className="value block">{pet.hobbies}</span>
                </div>

                <div className="detail-row span-full mt-2">
                    <span className="label block">Talents:</span>
                    <span className="value block">{pet.talents}</span>
                </div>
            </div>

            <div className="action-container">
                <button
                    className={`btn-interested ${isInterested ? 'interested-marked' : ''}`}
                    onClick={() => onInterested(pet)}
                >
                    {isInterested ? 'marked as interested' : 'interested'}
                </button>
            </div>
        </div>
    );
};

export default PetProfile;

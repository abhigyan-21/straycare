import React, { useState } from 'react';
import '../../styles/VetDashboard.css';
import '../../styles/VetAdopt.css';
import '../../styles/VetStatus.css';
import LiveStatusView from '../../components/vet/LiveStatusView';
import VetStatusCard from '../../components/vet/VetStatusCard';

const MOCK_DATA = {
    currentRescues: [
        {
            id: 'REP-7729',
            description: 'Golden Retriever found near Central Park with a leg injury.',
            status: 'in transit',
            image: null
        }
    ],
    inTreatment: [
        { id: 'PET-301', status: 'treated', image: null },
        { id: 'PET-302', status: 'up for adoption', image: null },
        { id: 'PET-303', status: 'under treatment', image: null },
    ]
};

const STATUS_OPTIONS = [
    { label: 'under treatment', value: 'under treatment', class: 'under-treatment' },
    { label: 'treated', value: 'treated', class: 'treated' },
    { label: 'up for adoption', value: 'up for adoption', class: 'up-for-adoption' }
];

function VetStatus() {
    const { currentRescues, inTreatment } = MOCK_DATA;
    const [treatmentList, setTreatmentList] = useState(inTreatment);

    const handleStatusChange = (id, newStatus) => {
        setTreatmentList(prev =>
            prev.map(pet => pet.id === id ? { ...pet, status: newStatus } : pet)
        );
    };

    return (
        <div className="vet-dashboard vet-status-page">
            <LiveStatusView rescues={currentRescues} />

            {/* List Section */}
            <div className="status-page-list">
                {treatmentList.map(pet => (
                    <VetStatusCard
                        key={pet.id}
                        id={pet.id}
                        status={pet.status}
                        onChange={(val) => handleStatusChange(pet.id, val)}
                        options={STATUS_OPTIONS}
                        image={pet.image}
                    />
                ))}
            </div>
        </div>
    );
}

export default VetStatus;
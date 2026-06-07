import React, { useState, useEffect } from 'react';
import '../../styles/vet/VetDashboard.css';
import '../../styles/vet/VetAdopt.css';
import '../../styles/vet/VetStatus.css';
import LiveStatusView from '../../components/vet/LiveStatusView';
import VetStatusCard from '../../components/vet/VetStatusCard';
import apiClient, { getClinicPets, updatePet } from '../../services/api';
import ActionLoader from '../../components/ActionLoader';

const STATUS_OPTIONS = [
    { label: 'under treatment', value: 'under treatment', class: 'under-treatment' },
    { label: 'treated', value: 'treated', class: 'treated' },
    { label: 'up for adoption', value: 'up for adoption', class: 'up-for-adoption' }
];

function VetStatus() {
    const [currentRescues, setCurrentRescues] = useState([]);
    const [treatmentList, setTreatmentList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [reportsRes, petsRes] = await Promise.all([
                apiClient.get('/reports/clinic'),
                getClinicPets()
            ]);

            const reports = reportsRes.data || [];
            const pets = petsRes.data || [];

            setCurrentRescues(reports.map(r => ({
                id: r.id.substring(0, 8).toUpperCase(),
                description: r.description,
                status: r.status.toLowerCase().replace('_', ' '),
                image: r.mediaUrls?.[0] || null
            })));

            setTreatmentList(pets.map(p => ({
                id: p.id,
                status: p.status === 'AVAILABLE' ? 'up for adoption' : p.status.toLowerCase().replace('_', ' '),
                image: p.mediaUrls?.[0] || null
            })));
        } catch (error) {
            console.error("Failed to fetch status data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleStatusChange = async (id, newStatus) => {
        try {
            const statusMap = {
                'under treatment': 'UNDER_TREATMENT',
                'treated': 'TREATED',
                'up for adoption': 'AVAILABLE'
            };
            const apiStatus = statusMap[newStatus] || newStatus.toUpperCase().replace(' ', '_');

            await updatePet(id, { status: apiStatus });
            fetchData();
        } catch (error) {
            console.error('Failed to update pet status:', error);
            alert('Failed to update status in database');
        }
    };

    if (isLoading) return <ActionLoader message="Loading treatment records..." />;

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
                {treatmentList.length === 0 && <p className="no-data">No pets currently in treatment</p>}
            </div>
        </div>
    );
}

export default VetStatus;
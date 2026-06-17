import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import '../../styles/vet/VetDashboard.css';
import '../../styles/vet/VetAdopt.css';
import '../../styles/vet/VetStatus.css';
import LiveStatusView from '../../components/vet/LiveStatusView';
import VetStatusCard from '../../components/vet/VetStatusCard';
import apiClient, { getClinicPets, updatePet } from '../../services/api';
import ActionLoader from '../../components/ActionLoader';
import CreateAdoptionModal from '../../components/vet/CreateAdoptionModal';
import { AlertTriangle } from 'lucide-react';

const REPORT_STATUS_OPTIONS = [
    { label: 'under treatment', value: 'under treatment', class: 'under-treatment' },
    { label: 'treated', value: 'treated', class: 'treated' },
    { label: 'create adoption', value: 'create adoption', class: 'up-for-adoption' }
];

const PET_STATUS_OPTIONS = [
    { label: 'under treatment', value: 'under treatment', class: 'under-treatment' },
    { label: 'treated', value: 'treated', class: 'treated' },
    { label: 'up for adoption', value: 'up for adoption', class: 'up-for-adoption' }
];

function VetStatus() {
    const [currentRescues, setCurrentRescues] = useState([]);
    const [treatmentList, setTreatmentList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showConfirm, setShowConfirm] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedReportId, setSelectedReportId] = useState(null);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [reportsRes, petsRes] = await Promise.all([
                apiClient.get('/reports/clinic'),
                getClinicPets()
            ]);

            const reports = Array.isArray(reportsRes.data) ? reportsRes.data : (reportsRes.data?.data || []);
            const pets = Array.isArray(petsRes) ? petsRes : (petsRes?.data || []);

            // 1. Live rescues (green box): Show REPORTED or ASSIGNED status reports
            const liveRescues = reports.filter(r => r.status === 'REPORTED' || r.status === 'ASSIGNED');
            setCurrentRescues(liveRescues.map(r => ({
                id: r.id.substring(0, 8).toUpperCase(),
                description: r.description,
                status: r.status.toLowerCase().replace('_', ' '),
                image: r.mediaUrls?.[0] || null
            })));

            // Find reportIds that are already proper Pet records to avoid duplication
            const petReportIds = new Set(pets.map(p => p.reportId).filter(Boolean));

            // 2. Treatment List: 
            // - Reports that have reached the clinic (RESCUED, TREATED) and aren't listed as Pets yet
            const reportTreatments = reports
                .filter(r => (r.status === 'RESCUED' || r.status === 'TREATED') && !petReportIds.has(r.id))
                .map(r => ({
                    id: r.id,
                    displayId: r.id.substring(0, 8).toUpperCase(),
                    status: r.status === 'RESCUED' ? 'under treatment' : r.status === 'TREATED' ? 'treated' : r.status.toLowerCase().replace('_', ' '),
                    image: r.mediaUrls?.[0] || null,
                    name: r.description ? (r.description.length > 20 ? r.description.substring(0, 20) + '...' : r.description) : 'Stray Animal',
                    isReport: true
                }));

            // - Proper Pet profiles under treatment/treated at the clinic (exclude AVAILABLE/up for adoption)
            const petTreatments = pets
                .filter(p => p.status === 'UNDER_TREATMENT' || p.status === 'TREATED')
                .map(p => ({
                    id: p.id,
                    displayId: p.id.substring(0, 8).toUpperCase(),
                    status: p.status.toLowerCase().replace('_', ' '),
                    image: p.image || null,
                    name: p.name || 'Unknown Pet',
                    isPet: true
                }));

            setTreatmentList([...reportTreatments, ...petTreatments]);
        } catch (error) {
            console.error("Failed to fetch status data:", error);
            setError("Failed to fetch status/treatment data. Please check your connection or try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleStatusChange = async (item, newStatus) => {
        if (newStatus === 'create adoption') {
            setShowConfirm({ type: 'create_adoption', item });
            return;
        }

        try {
            if (item.isPet) {
                const statusMap = {
                    'under treatment': 'UNDER_TREATMENT',
                    'treated': 'TREATED',
                    'up for adoption': 'AVAILABLE'
                };
                const apiStatus = statusMap[newStatus] || newStatus.toUpperCase().replace(' ', '_');
                await updatePet(item.id, { status: apiStatus });
            } else if (item.isReport) {
                const statusMap = {
                    'under treatment': 'RESCUED',
                    'treated': 'TREATED'
                };
                const apiStatus = statusMap[newStatus] || newStatus.toUpperCase().replace(' ', '_');
                await apiClient.patch(`/reports/${item.id}/status`, { status: apiStatus });
            }
            fetchData();
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update status in database');
        }
    };

    const confirmAction = () => {
        if (showConfirm.type === 'create_adoption') {
            setSelectedReportId(showConfirm.item.id);
            setShowCreateModal(true);
        }
        setShowConfirm(null);
    };

    const handlePublishAdoption = async (formData) => {
        try {
            // Create proper Pet record linked to the report
            await apiClient.post('/adoptions/pets', {
                ...formData,
                reportId: selectedReportId
            });

            // Mark the report status to TREATED
            await apiClient.patch(`/reports/${selectedReportId}/status`, {
                status: 'TREATED'
            });

            fetchData();
        } catch (error) {
            console.error('Failed to list pet for adoption:', error);
            alert('Failed to list pet for adoption');
        } finally {
            setShowCreateModal(false);
            setSelectedReportId(null);
        }
    };

    if (isLoading) return <ActionLoader message="Loading treatment records..." />;

    return (
        <>
            <Helmet>
                <title>Furzo Vet Portal - Status</title>
                <meta name="description" content="Track and update treatment statuses of rescued animals at your clinic on the Furzo Vet Portal." />
            </Helmet>
            <div className="vet-dashboard vet-status-page">
                {error && (
                    <div className="error-banner" style={{ padding: '12px 20px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '500' }}>
                        <AlertTriangle size={20} />
                        <span>{error}</span>
                    </div>
                )}
                <LiveStatusView rescues={currentRescues} />

                {/* List Section */}
                <div className="status-page-list">
                    {treatmentList.map(item => (
                        <VetStatusCard
                            key={item.id}
                            id={item.displayId}
                            name={item.name}
                            status={item.status}
                            onChange={(val) => handleStatusChange(item, val)}
                            options={item.isReport ? REPORT_STATUS_OPTIONS : PET_STATUS_OPTIONS}
                            image={item.image}
                        />
                    ))}
                    {treatmentList.length === 0 && <p className="no-data">No pets currently in treatment</p>}
                </div>

                {/* Confirmation Modal */}
                {showConfirm && (
                    <div className="modal-overlay">
                        <div className="modal-content confirmation">
                            <AlertTriangle className="modal-icon warning" size={48} />
                            <h2>Create Adoption Post</h2>
                            <p>Are you sure you want to list this pet for adoption? This will open the adoption profile form.</p>
                            <div className="modal-actions">
                                <button className="confirm-btn" onClick={confirmAction}>Yes, create profile</button>
                                <button className="cancel-btn" onClick={() => setShowConfirm(null)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create Adoption Post Modal */}
                <CreateAdoptionModal
                    isOpen={showCreateModal}
                    onClose={() => {
                        setShowCreateModal(false);
                        setSelectedReportId(null);
                    }}
                    onPublish={handlePublishAdoption}
                />
            </div>
        </>
    );
}

export default VetStatus;

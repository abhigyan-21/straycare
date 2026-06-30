import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import '../../styles/vet/VetDashboard.css';
import '../../styles/vet/VetAdopt.css';
import '../../styles/vet/VetStatus.css';
import { Calendar, AlertTriangle, Plus } from 'lucide-react';
import VetStatusCard from '../../components/vet/VetStatusCard';
import VetRequestCard from '../../components/vet/VetRequestCard';
import InterviewCard from '../../components/vet/InterviewCard';
import VetTabs from '../../components/vet/VetTabs';
import CreateAdoptionModal from '../../components/vet/CreateAdoptionModal';
import ActionLoader from '../../components/ActionLoader';
import apiClient, { updatePet } from '../../services/api';
import { useVetDataStore } from '../../store/vetDataStore';

const ADOPT_STATUS_OPTIONS = [
    { label: 'up for adoption', value: 'up for adoption', class: 'up-for-adoption' },
    { label: 'Adopted', value: 'Adopted', class: 'treated' },
    { label: 'Remove', value: 'Remove', class: 'under-treatment' }
];

function VetAdopt() {
    const [activeTab, setActiveTab] = useState('live');
    const [showConfirm, setShowConfirm] = useState(null);
    const [showTimePicker, setShowTimePicker] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [data, setData] = useState({
        todaysInterviews: [],
        liveAdoptions: [],
        currentRequests: [],
        newRequests: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const { fetchPets, fetchRequests, invalidatePets, invalidateRequests } = useVetDataStore();

    const fetchData = async (force = false) => {
        setIsLoading(true);
        setError(null);
        const startTime = Date.now();
        try {
            const [petsData, reqsData] = await Promise.all([
                fetchPets(force),
                fetchRequests(force)
            ]);

            const pets = Array.isArray(petsData) ? petsData : [];
            const reqs = Array.isArray(reqsData) ? reqsData : [];

            const today = new Date().toISOString().split('T')[0];

            setData({
                liveAdoptions: pets
                    .filter(p => p.status === 'AVAILABLE')
                    .map(p => ({
                        id: p.id,
                        petName: p.name,
                        status: 'up for adoption',
                        image: p.image || null
                    })),
                todaysInterviews: reqs.filter(r => r.status === 'INTERVIEW_SCHEDULED' && r.interviewDate?.startsWith(today)).map(r => ({
                    id: r.id,
                    petId: r.petId,
                    adopteeName: r.user?.name,
                    contact: r.user?.contact || r.user?.email,
                    time: r.interviewTime
                })),
                currentRequests: reqs.filter(r => r.status === 'INTERVIEW_SCHEDULED').map(r => ({
                    id: r.id,
                    name: r.user?.name,
                    contact: r.user?.email,
                    status: r.status.toLowerCase()
                })),
                newRequests: reqs.filter(r => r.status === 'PENDING').map(r => ({
                    id: r.id,
                    name: r.user?.name,
                    contact: r.user?.email
                }))
            });
        } catch (error) {
            console.error("Failed to fetch VetAdopt data:", error);
            setError("Failed to fetch adoption data. Please check your connection or try again later.");
            setData({
                todaysInterviews: [],
                liveAdoptions: [],
                currentRequests: [],
                newRequests: []
            });
        } finally {
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, 800 - elapsedTime);
            setTimeout(() => {
                setIsLoading(false);
            }, remainingTime);
        }
    };

    useEffect(() => {
        fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleStatusChange = (id, newStatus) => {
        if (newStatus === 'Adopted' || newStatus === 'Remove') {
            setShowConfirm({ type: 'status', id, value: newStatus });
        } else {
            console.log(`Status changed for ${id} to ${newStatus}`);
        }
    };

    const confirmAction = async () => {
        const { id, value } = showConfirm;

        // Optimistic UI update: Instantly remove it from the 'liveAdoptions' list
        // since 'Remove' or 'Adopted' means it's no longer 'AVAILABLE'.
        setData(prev => ({
            ...prev,
            liveAdoptions: prev.liveAdoptions.filter(p => p.id !== id)
        }));
        setShowConfirm(null); // Close modal instantly

        try {
            const statusMap = { 'Adopted': 'ADOPTED', 'Remove': 'REMOVED', 'up for adoption': 'AVAILABLE' };
            const apiStatus = statusMap[value] || value.toUpperCase().replace(' ', '_');

            await updatePet(id, { status: apiStatus });
            invalidatePets();
            // Background sync
            fetchData(true);
        } catch (error) {
            console.error('API failed:', error);
            // Revert state if failed
            fetchData();
        }
    };

    const handleSetTime = (req) => {
        setShowTimePicker(req);
    };

    const saveTime = async () => {
        try {
            await apiClient.patch(`/adoptions/requests/${showTimePicker.id}`, {
                status: 'INTERVIEW_SCHEDULED',
                interviewDate: selectedDate,
                interviewTime: selectedTime
            });
            invalidateRequests();
            fetchData(true);
        } catch (error) {
            console.error('API failed, mock save time:', error);
            setData(prev => ({
                ...prev,
                newRequests: prev.newRequests.filter(r => r.id !== showTimePicker.id),
                currentRequests: [...prev.currentRequests, { ...showTimePicker, status: 'interview' }]
            }));
        }
        setShowTimePicker(null);
        setSelectedDate('');
        setSelectedTime('');
    };

    const handleAcceptRequest = async (reqId) => {
        // Optimistic UI update: instantly remove from screen
        setData(prev => ({
            ...prev,
            currentRequests: prev.currentRequests.filter(r => r.id !== reqId),
            newRequests: prev.newRequests.filter(r => r.id !== reqId)
        }));

        try {
            await apiClient.patch(`/adoptions/requests/${reqId}`, {
                status: 'APPROVED'
            });
            invalidateRequests();
            fetchData(true);
        } catch (error) {
            console.error('Failed to accept request:', error);
            fetchData(); // Revert on failure
        }
    };

    const handleRejectRequest = async (reqId) => {
        // Optimistic UI update: instantly remove from screen
        setData(prev => ({
            ...prev,
            currentRequests: prev.currentRequests.filter(r => r.id !== reqId),
            newRequests: prev.newRequests.filter(r => r.id !== reqId)
        }));

        try {
            await apiClient.patch(`/adoptions/requests/${reqId}`, {
                status: 'REJECTED'
            });
            invalidateRequests();
            fetchData(true);
        } catch (error) {
            console.error('Failed to reject request:', error);
            fetchData(); // Revert on failure
        }
    };

    const handlePublishAdoption = async (formData) => {
        try {
            await apiClient.post('/adoptions/pets', formData);
            invalidatePets();
            fetchData(true);
        } catch (error) {
            console.error('API failed, mock publish:', error);
            const newPet = { id: `PET-${Date.now()}`, petName: formData.name, status: 'up for adoption', image: null };
            setData(prev => ({
                ...prev,
                liveAdoptions: [newPet, ...prev.liveAdoptions]
            }));
        }
    };

    const tabs = [
        { id: 'live', label: 'Live adoptions' },
        { id: 'current', label: 'Current Requests' },
        { id: 'new', label: 'New Requests' }
    ];

    return (
        <>
            <Helmet>
                <title>Furzo Vet Portal - Adoptions</title>
                <meta name="description" content="Manage live adoption listings, review adoption requests, and schedule interviews from your Furzo clinic portal." />
            </Helmet>
            <div className="vet-dashboard vet-adopt-page">
                {error && (
                    <div className="error-banner" style={{ padding: '12px 20px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '500' }}>
                        <AlertTriangle size={20} />
                        <span>{error}</span>
                    </div>
                )}
                <div className="main-rescue-section adopt-interview-section">
                    <div className="section-header">
                        <h1 className="section-title">Todays Interview</h1>
                    </div>
                    <div className="rescues-scroll-wrapper">
                        <div className="rescues-container">
                            {data.todaysInterviews.map((interview) => (
                                <InterviewCard key={interview.id} interview={interview} />
                            ))}
                            {data.todaysInterviews.length === 0 && (
                                <div className="rescue-card-white" style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '15px', width: '100%' }}>
                                    <Calendar size={48} color="#999" style={{ strokeWidth: 1.5 }} />
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                        <div style={{ fontSize: '1.4rem', color: '#333', fontWeight: '700' }}>
                                            No interviews today
                                        </div>
                                        <div style={{ fontSize: '1rem', color: '#888', fontWeight: '400' }}>
                                            There are no rescue adoption interviews scheduled for today.
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <VetTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

                <div className="adopt-list-container">
                    {isLoading ? <ActionLoader message="Fetching adoption data..." /> : (
                        <>
                            {activeTab === 'live' && data.liveAdoptions.map(pet => (
                                <VetStatusCard
                                    key={pet.id}
                                    id={pet.id}
                                    name={pet.petName}
                                    status={pet.status}
                                    onChange={(val) => handleStatusChange(pet.id, val)}
                                    options={ADOPT_STATUS_OPTIONS}
                                    image={pet.image}
                                />
                            ))}

                            {activeTab === 'current' && data.currentRequests.map(req => (
                                <VetRequestCard
                                    key={req.id}
                                    req={req}
                                    onAccept={() => handleAcceptRequest(req.id)}
                                    onReject={() => handleRejectRequest(req.id)}
                                />
                            ))}

                            {activeTab === 'new' && data.newRequests.map(req => (
                                <VetRequestCard
                                    key={req.id}
                                    req={req}
                                    isNew={true}
                                    onSetTime={handleSetTime}
                                    onAccept={() => handleAcceptRequest(req.id)}
                                    onReject={() => handleRejectRequest(req.id)}
                                />
                            ))}
                            {activeTab === 'live' && data.liveAdoptions.length === 0 && <p className="no-data">No live adoptions</p>}
                            {activeTab === 'current' && data.currentRequests.length === 0 && <p className="no-data">No current requests</p>}
                            {activeTab === 'new' && data.newRequests.length === 0 && <p className="no-data">No new requests</p>}
                        </>
                    )}
                </div>

                {showConfirm && (
                    <div className="modal-overlay">
                        <div className="modal-content confirmation">
                            <AlertTriangle className="modal-icon warning" size={48} />
                            <h2>Confirm Action</h2>
                            <p>Are you sure you want to change the status to <strong>{showConfirm.value}</strong>?</p>
                            <div className="modal-actions">
                                <button className="confirm-btn" onClick={confirmAction}>Confirm</button>
                                <button className="cancel-btn" onClick={() => setShowConfirm(null)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )}

                {showTimePicker && (
                    <div className="modal-overlay">
                        <div className="modal-content time-picker">
                            <Calendar className="modal-icon info" size={48} />
                            <h2>Schedule Interview</h2>
                            <p>Select date and time for <strong>{showTimePicker.name}</strong></p>
                            <div className="input-group">
                                <label>Date</label>
                                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label>Time</label>
                                <input type="time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} />
                            </div>
                            <div className="modal-actions">
                                <button className="confirm-btn" onClick={saveTime}>Save Schedule</button>
                                <button className="cancel-btn" onClick={() => setShowTimePicker(null)}>Discard</button>
                            </div>
                        </div>
                    </div>
                )}

                <button
                    className="floating-create-btn"
                    onClick={() => setShowCreateModal(true)}
                >
                    <Plus size={24} />
                    <span>Create Adoption</span>
                </button>

                <CreateAdoptionModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onPublish={handlePublishAdoption}
                />
            </div>
        </>
    );
}

export default VetAdopt;


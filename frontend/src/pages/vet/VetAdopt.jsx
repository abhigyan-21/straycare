import React, { useState, useEffect } from 'react';
import '../../styles/vet/VetDashboard.css';
import '../../styles/vet/VetAdopt.css';
import '../../styles/vet/VetStatus.css';
import { Calendar, AlertTriangle, Plus } from 'lucide-react';
import VetStatusCard from '../../components/vet/VetStatusCard';
import VetRequestCard from '../../components/vet/VetRequestCard';
import InterviewCard from '../../components/vet/InterviewCard';
import VetTabs from '../../components/vet/VetTabs';
import CreateAdoptionModal from '../../components/vet/CreateAdoptionModal';

import { ADOPT_STATUS_OPTIONS, MOCK_ADOPT_DATA } from '../../data/mock_vet_data';

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

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [petsRes, reqsRes] = await Promise.all([
                fetch('/api/adoptions/pets', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                }),
                fetch('/api/adoptions/requests', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                })
            ]);

            if (!petsRes.ok || !reqsRes.ok) throw new Error('Backend offline');

            const petsData = await petsRes.json();
            const reqsData = await reqsRes.json();

            const pets = petsData.data || [];
            const reqs = reqsData.data || [];

            const today = new Date().toISOString().split('T')[0];

            setData({
                liveAdoptions: pets.map(p => ({
                    id: p.id,
                    petName: p.name,
                    status: p.status === 'AVAILABLE' ? 'up for adoption' : p.status,
                    image: p.mediaUrls?.[0] || null
                })),
                todaysInterviews: reqs.filter(r => r.status === 'INTERVIEW_SCHEDULED' && r.interviewDate?.startsWith(today)).map(r => ({
                    id: r.id,
                    petId: r.petId,
                    adopteeName: r.user.name,
                    contact: r.user.contact || r.user.email,
                    time: r.interviewTime
                })),
                currentRequests: reqs.filter(r => r.status === 'INTERVIEW_SCHEDULED' || r.status === 'APPROVED').map(r => ({
                    id: r.id,
                    name: r.user.name,
                    contact: r.user.email,
                    status: r.status.toLowerCase()
                })),
                newRequests: reqs.filter(r => r.status === 'PENDING').map(r => ({
                    id: r.id,
                    name: r.user.name,
                    contact: r.user.email
                }))
            });
        } catch (error) {
            console.warn("Using mock data fallback for VetAdopt:", error);
            setData({
                todaysInterviews: MOCK_ADOPT_DATA.todaysInterviews,
                liveAdoptions: MOCK_ADOPT_DATA.liveAdoptions,
                currentRequests: MOCK_ADOPT_DATA.currentRequests,
                newRequests: MOCK_ADOPT_DATA.newRequests
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
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
        try {
            const statusMap = { 'Adopted': 'ADOPTED', 'Remove': 'REMOVED', 'up for adoption': 'AVAILABLE' };
            const apiStatus = statusMap[value] || value;

            const response = await fetch(`/api/adoptions/pets/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status: apiStatus })
            });

            if (response.ok) {
                fetchData();
            } else {
                throw new Error('Update failed');
            }
        } catch (error) {
            console.error('API failed, mock confirm:', error);
            setData(prev => ({
                ...prev,
                liveAdoptions: prev.liveAdoptions.map(p => p.id === id ? { ...p, status: value } : p)
            }));
        }
        setShowConfirm(null);
    };

    const handleSetTime = (req) => {
        setShowTimePicker(req);
    };

    const saveTime = async () => {
        try {
            const response = await fetch(`/api/adoptions/requests/${showTimePicker.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    status: 'INTERVIEW_SCHEDULED',
                    interviewDate: selectedDate,
                    interviewTime: selectedTime
                })
            });

            if (response.ok) {
                fetchData();
            } else {
                throw new Error('Failed to save time');
            }
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

    const handlePublishAdoption = async (formData) => {
        try {
            const response = await fetch('/api/adoptions/pets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                fetchData();
            } else {
                throw new Error('Failed to publish');
            }
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
        <div className="vet-dashboard vet-adopt-page">
            <div className="main-rescue-section adopt-interview-section">
                <div className="section-header">
                    <h1 className="section-title">Todays Interview</h1>
                </div>
                <div className="rescues-scroll-wrapper">
                    <div className="rescues-container">
                        {data.todaysInterviews.map((interview) => (
                            <InterviewCard key={interview.id} interview={interview} />
                        ))}
                        {data.todaysInterviews.length === 0 && <p className="no-data">No interviews for today</p>}
                    </div>
                </div>
            </div>

            <VetTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="adopt-list-container">
                {isLoading ? <p>Loading...</p> : (
                    <>
                        {activeTab === 'live' && data.liveAdoptions.map(pet => (
                            <VetStatusCard 
                                key={pet.id}
                                id={pet.id}
                                status={pet.status}
                                onChange={(val) => handleStatusChange(pet.id, val)}
                                options={ADOPT_STATUS_OPTIONS}
                                image={pet.image}
                            />
                        ))}

                        {activeTab === 'current' && data.currentRequests.map(req => (
                            <VetRequestCard key={req.id} req={req} />
                        ))}

                        {activeTab === 'new' && data.newRequests.map(req => (
                            <VetRequestCard 
                                key={req.id} 
                                req={req} 
                                isNew={true}
                                onSetTime={handleSetTime}
                                onAccept={() => console.log('Accepted', req.id)}
                                onReject={() => console.log('Rejected', req.id)}
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
    );
}

export default VetAdopt;


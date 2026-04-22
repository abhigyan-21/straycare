import React, { useState } from 'react';
import '../../styles/vet/VetDashboard.css';
import '../../styles/vet/VetAdopt.css';
import '../../styles/vet/VetStatus.css';
import { Calendar, AlertTriangle, Plus } from 'lucide-react';
import VetStatusCard from '../../components/vet/VetStatusCard';
import VetRequestCard from '../../components/vet/VetRequestCard';
import InterviewCard from '../../components/vet/InterviewCard';
import VetTabs from '../../components/vet/VetTabs';
import CreateAdoptionModal from '../../components/vet/CreateAdoptionModal';

const ADOPT_STATUS_OPTIONS = [
    { label: 'up for adoption', value: 'up for adoption', class: 'up-for-adoption' },
    { label: 'Adopted', value: 'Adopted', class: 'adopted' },
    { label: 'Remove', value: 'Remove', class: 'remove' }
];

const MOCK_DATA = {
    todaysInterviews: [
        { id: 'PET-203', petId: 'P001', adopteeName: 'John Doe', contact: '+1 234 567 890', time: '10:30 AM' },
        { id: 'PET-204', petId: 'P005', adopteeName: 'Jane Smith', contact: '+1 987 654 321', time: '02:15 PM' },
    ],
    liveAdoptions: [
        { id: 'PET-101', petName: 'Buddy', status: 'up for adoption', image: null },
        { id: 'PET-102', petName: 'Luna', status: 'Adopted', image: null },
        { id: 'PET-103', petName: 'Max', status: 'Remove', image: null },
    ],
    currentRequests: [
        { id: 'REQ-501', name: 'Alice Wilson', contact: 'alice@example.com', status: 'interview' },
        { id: 'REQ-502', name: 'Bob Brown', contact: 'bob.b@example.com', status: 'cancelled' },
    ],
    newRequests: [
        { id: 'REQ-601', name: 'Charlie Davis', contact: 'charlie.d@gmail.com' },
        { id: 'REQ-602', name: 'Diana Prince', contact: 'diana.p@outlook.com' },
    ]
};

function VetAdopt() {
    const [activeTab, setActiveTab] = useState('live');
    const [showConfirm, setShowConfirm] = useState(null);
    const [showTimePicker, setShowTimePicker] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');

    const handleStatusChange = (id, newStatus) => {
        if (newStatus === 'Adopted' || newStatus === 'Remove') {
            setShowConfirm({ type: 'status', id, value: newStatus });
        } else {
            console.log(`Status changed for ${id} to ${newStatus}`);
        }
    };

    const confirmAction = () => {
        console.log(`Confirmed ${showConfirm.type} change for ${showConfirm.id} to ${showConfirm.value}`);
        setShowConfirm(null);
    };

    const handleSetTime = (req) => {
        setShowTimePicker(req);
    };

    const saveTime = () => {
        console.log(`Setting time for ${showTimePicker.id}: ${selectedDate} at ${selectedTime}`);
        setShowTimePicker(null);
        setSelectedDate('');
        setSelectedTime('');
    };

    const handlePublishAdoption = (data) => {
        console.log('Publishing new adoption:', data);
        // Here you would typically call an API
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
                        {MOCK_DATA.todaysInterviews.map((interview) => (
                            <InterviewCard key={interview.id} interview={interview} />
                        ))}
                    </div>
                </div>
            </div>

            <VetTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="adopt-list-container">
                {activeTab === 'live' && MOCK_DATA.liveAdoptions.map(pet => (
                    <VetStatusCard 
                        key={pet.id}
                        id={pet.id}
                        status={pet.status}
                        onChange={(val) => handleStatusChange(pet.id, val)}
                        options={ADOPT_STATUS_OPTIONS}
                        image={pet.image}
                    />
                ))}

                {activeTab === 'current' && MOCK_DATA.currentRequests.map(req => (
                    <VetRequestCard key={req.id} req={req} />
                ))}

                {activeTab === 'new' && MOCK_DATA.newRequests.map(req => (
                    <VetRequestCard 
                        key={req.id} 
                        req={req} 
                        isNew={true}
                        onSetTime={handleSetTime}
                        onAccept={() => console.log('Accepted', req.id)}
                        onReject={() => console.log('Rejected', req.id)}
                    />
                ))}
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


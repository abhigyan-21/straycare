import React, { useState, useEffect } from 'react';
import '../styles/Track.css';

// Mock Data
const MOCK_PET = {
    id: "4435",
    name: "Bizoo",
    image: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
    statusIndex: 2, // 0 to 4 (e.g. 2 means up to Treatment is complete/active)
    details: [
        { label: "Date of Rescue", value: "Oct 12, 2026" },
        { label: "Location", value: "Sector 14, Main Road" },
        { label: "Condition", value: "Minor injuries, expected full recovery" },
        { label: "Assigned Center", value: "StrayCare North Haven" }
    ],
    history: [
        { date: "Oct 12, 10:30 AM", stage: "Rescue in progress", notes: "Team dispatched to reported location." },
        { date: "Oct 12, 11:45 AM", stage: "Reached center", notes: "Admitted into StrayCare North Haven." },
        { date: "Oct 13, 09:00 AM", stage: "Treatment", notes: "Started medical treatment for minor wounds." }
    ]
};

const STAGES = [
    "rescue in progress",
    "reached center",
    "treatment",
    "open for adoption",
    "Adopted/Fostered"
];

function Track() {
    const [trackingId, setTrackingId] = useState("");
    const [petData, setPetData] = useState(null);
    const [animateTimeline, setAnimateTimeline] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    const handleTrack = () => {
        // Simulate fetching
        setPetData(MOCK_PET);
        setAnimateTimeline(false);
        setTimeout(() => setAnimateTimeline(true), 100);
    };

    return (
        <div className="track-page">
            <div className="search-section">
                <input
                    type="text"
                    placeholder="Tracking Id:"
                    className="search-input"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                />
                <button className="track-btn" onClick={handleTrack}>track</button>
            </div>

            {petData && (
                <>
                    <div className="tracking-content">
                        <div className="pet-info-card">
                            <div className="pet-image-container">
                                <img src={petData.image} alt={petData.name} className="pet-image" />
                            </div>
                            <div className="pet-name-plate">{petData.name}</div>
                            <div className="pet-id-pill">id:{petData.id}</div>
                        </div>

                        <div className="timeline-section">
                            {/* Wavy path background */}
                            <svg className="timeline-svg" preserveAspectRatio="none" viewBox="0 0 1000 400">
                                {/* 
                  Curve to follow nodes: 
                  node-1 (150, 100) -> node-2 (550, 100) -> node-3 (850, 180) -> node-4 (550, 300) -> node-5 (150, 300)
                */}
                                <path className="timeline-path" d="M 150 100 C 300 100, 400 50, 550 100 C 650 130, 850 100, 850 180 C 850 250, 700 280, 550 300 C 400 320, 300 250, 150 300" />
                                {animateTimeline && petData.statusIndex >= 0 && (
                                    <path className="timeline-path-active" d="M 150 100 C 300 100, 400 50, 550 100 C 650 130, 850 100, 850 180 C 850 250, 700 280, 550 300 C 400 320, 300 250, 150 300" />
                                )}
                            </svg>

                            <div className="timeline-nodes">
                                {STAGES.map((stage, index) => {
                                    let statusClass = "node";
                                    if (petData.statusIndex > index) statusClass += " completed";
                                    else if (petData.statusIndex === index && animateTimeline) statusClass += " active";

                                    return (
                                        <div
                                            key={index}
                                            className={`node node-${index + 1} ${statusClass}`}
                                            style={{ '--delay': `${index * 0.5}s` }}
                                        >
                                            <span className="node-text">{stage}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="details-section">
                        <table className="details-table">
                            <thead>
                                <tr>
                                    <th colSpan={2}>Tracking Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {petData.details.map((row, index) => (
                                    <tr key={index}>
                                        <td style={{ width: '30%', fontWeight: 'bold' }}>{row.label}</td>
                                        <td>{row.value}</td>
                                    </tr>
                                ))}
                                <tr>
                                    <td style={{ width: '30%', fontWeight: 'bold' }}>Current Status</td>
                                    <td style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ textTransform: 'capitalize' }}>{STAGES[petData.statusIndex]}</span>
                                        <button className="view-more-btn" onClick={() => setShowHistoryModal(true)}>
                                            View More Details
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {showHistoryModal && (
                <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
                    <div className="history-modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Complete Process History</h3>
                        <div className="history-table-container">
                            <table className="history-table">
                                <thead>
                                    <tr>
                                        <th>Date/Time</th>
                                        <th>Stage</th>
                                        <th>Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {petData.history.map((record, index) => (
                                        <tr key={index}>
                                            <td>{record.date}</td>
                                            <td style={{ textTransform: 'capitalize' }}>{record.stage}</td>
                                            <td>{record.notes}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="close-btn-container">
                            <button className="close-btn" onClick={() => setShowHistoryModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Track;
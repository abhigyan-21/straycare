import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import '../../styles/user/Track.css';
import apiClient, { getPartner } from '../../services/api';

const STAGES = [
    "rescue in progress",
    "reached center",
    "treatment",
    "open for adoption",
    "Adopted/Fostered"
];

function Track() {
    const location = useLocation();
    const [trackingId, setTrackingId] = useState("");
    const [petData, setPetData] = useState(null);
    const [animateTimeline, setAnimateTimeline] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const fetchTrackingDetails = async (idToTrack) => {
        if (!idToTrack) return;
        setIsLoading(true);
        setErrorMsg("");
        try {
            const response = await apiClient.get(`/reports/${idToTrack.trim()}`);
            const r = response.data;
            const partner = getPartner(r);
            const rescuerPartner = getPartner(r.rescuer);

            let statusIndex = -1;
            if (r.status === 'ASSIGNED') {
                statusIndex = 0;
            } else if (r.status === 'RESCUED') {
                statusIndex = 1;
            } else if (r.status === 'TREATED') {
                if (r.pet) {
                    if (r.pet.status === 'AVAILABLE') {
                        statusIndex = 3;
                    } else if (r.pet.status === 'ADOPTED') {
                        statusIndex = 4;
                    } else {
                        statusIndex = 2; // treatment
                    }
                } else {
                    statusIndex = 2; // treatment
                }
            } else if (r.status === 'ADOPTED') {
                statusIndex = 4;
            }

            const details = [
                { label: "Date of Report", value: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
                { label: "Location Coordinates", value: `Lat: ${r.locationLat.toFixed(4)}, Lng: ${r.locationLng.toFixed(4)}` },
                { label: "Condition Reported", value: r.description || 'N/A' },
                { label: "Assigned Center", value: partner?.name || rescuerPartner?.name || 'StrayCare Center' }
            ];

            const history = [];

            // 1. request filed
            history.push({
                date: new Date(r.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                stage: "rescue request filed",
                notes: "Rescue report created with description: " + r.description
            });

            // 2. assigned
            if (r.status !== 'REPORTED') {
                history.push({
                    date: "Ongoing",
                    stage: "rescuer assigned",
                    notes: `Rescuer ${r.rescuer?.name || 'assigned'} has accepted the case and is en-route.`
                });
            }

            // 3. rescued
            if (r.status === 'RESCUED' || r.status === 'TREATED' || r.status === 'ADOPTED') {
                history.push({
                    date: r.lastTracked ? new Date(r.lastTracked).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Rescue complete",
                    stage: "reached center",
                    notes: `Animal successfully rescued and taken to ${partner?.name || rescuerPartner?.name || 'clinic'} for care.`
                });
            }

            // 4. treatment (medical records)
            if (r.medicalRecords && r.medicalRecords.length > 0) {
                r.medicalRecords.forEach(mr => {
                    history.push({
                        date: new Date(mr.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                        stage: "treatment logs",
                        notes: `Diagnosis: ${mr.diagnosis || 'Under Observation'}. Treatment: ${mr.treatment || 'N/A'}`
                    });
                });
            } else if (r.status === 'RESCUED') {
                history.push({
                    date: "Ongoing",
                    stage: "treatment",
                    notes: "Admitted into veterinary ward and started medical observation/treatment."
                });
            } else if (r.status === 'TREATED' && (!r.pet || r.pet.status === 'UNDER_TREATMENT')) {
                history.push({
                    date: "Ongoing",
                    stage: "treatment",
                    notes: "Admitted into veterinary ward and started medical observation/treatment."
                });
            }

            // 5. treated (open for adoption)
            if ((r.pet && r.pet.status === 'AVAILABLE') || r.status === 'ADOPTED' || (r.pet && r.pet.status === 'ADOPTED')) {
                history.push({
                    date: "Completed",
                    stage: "open for adoption",
                    notes: "Animal recovery complete. Now listed on our Adopt page for adoption!"
                });
            }

            // 6. adopted
            if (r.status === 'ADOPTED' || (r.pet && r.pet.status === 'ADOPTED')) {
                history.push({
                    date: "Completed",
                    stage: "Adopted/Fostered",
                    notes: "Animal adopted into a permanent loving family!"
                });
            }

            setPetData({
                id: r.id.substring(0, 8),
                name: r.pet?.name || null,
                image: r.mediaUrls?.[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                statusIndex: statusIndex,
                details: details,
                history: history.reverse()
            });


            setAnimateTimeline(false);
            setTimeout(() => setAnimateTimeline(true), 100);
        } catch (err) {
            console.error("Error fetching tracking details:", err);
            setErrorMsg("No rescue report found with this ID. Please verify the ID and try again.");
            setPetData(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (location.state && location.state.trackingId) {
            setTrackingId(location.state.trackingId);
            fetchTrackingDetails(location.state.trackingId);
        }
    }, [location.state?.trackingId]);

    const handleTrack = () => {
        if (!trackingId) return;
        fetchTrackingDetails(trackingId);
    };

    return (
        <>
        <Helmet>
            <title>Furzo - Track a Rescue</title>
            <meta name="description" content="Track the rescue progress of a reported stray animal through Furzo's real-time rescue tracking system." />
            <meta property="og:title" content="Furzo - Track a Rescue" />
            <meta property="og:description" content="Track the rescue progress of a reported stray animal through Furzo's real-time rescue tracking system." />
            <meta property="og:image" content="https://furzo.vercel.app/FurzoBanner.jpg" />
            <meta property="og:url" content="https://furzo.vercel.app/track" />
            <meta property="og:type" content="website" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="Furzo - Track a Rescue" />
            <meta name="twitter:description" content="Track the rescue progress of a reported stray animal through Furzo's real-time rescue tracking system." />
            <meta name="twitter:image" content="https://furzo.vercel.app/FurzoBanner.jpg" />
        </Helmet>
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

            {isLoading && (
                <div style={{ textAlign: 'center', margin: '40px auto', fontSize: '1.1rem', color: '#666', fontWeight: '500' }}>
                    Searching database for Report ID...
                </div>
            )}

            {errorMsg && (
                <div style={{ maxWidth: '600px', margin: '30px auto', padding: '16px 20px', background: '#fdf2f2', border: '1px solid #fde2e2', borderRadius: '8px', color: '#e74c3c', fontWeight: 'bold', textAlign: 'center', fontSize: '0.95rem' }}>
                    {errorMsg}
                </div>
            )}

            {!isLoading && petData && (
                <>
                    <div className="tracking-content">
                        <div className="pet-info-card">
                            <div className="pet-image-container">
                                <img src={petData.image} alt={petData.name || "Pet"} className="pet-image" />
                            </div>
                            {petData.name && <div className="pet-name-plate">{petData.name}</div>}
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
                                        <span style={{ textTransform: 'capitalize' }}>
                                            {petData.statusIndex >= 0 ? STAGES[petData.statusIndex] : 'reported'}
                                        </span>
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
        </>
    );
}

export default Track;

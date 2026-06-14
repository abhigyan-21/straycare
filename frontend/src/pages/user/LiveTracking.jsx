import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { useRescueStore } from '../../store/rescueStore';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import io from 'socket.io-client';
import '../../styles/user/LiveTracking.css';
import apiClient, { getPartner } from '../../services/api';
import { User } from 'lucide-react';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Memoize Icons
const createAmbulanceIcon = (isFlipped) => new L.Icon({
  iconUrl: ambulanceImg,
  iconSize: [60, 40],
  iconAnchor: [30, 20],
  className: `ambulance-map-icon ${isFlipped ? 'flipped' : ''}`
});

// Asset Imports
import ambulanceImg from '../../assets/images/ambulance.webp';
import hospitalImg from "../../assets/images/Hospital.webp";
import pickupImg from '../../assets/images/Pickup.webp';
import rescuerAvatar from '../../assets/images/doctor-open.webp';

const hospitalIcon = new L.Icon({ iconUrl: hospitalImg, iconSize: [50, 50], iconAnchor: [25, 50] });
const userIcon = new L.Icon({ iconUrl: pickupImg, iconSize: [45, 45], iconAnchor: [22, 45] });

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

// Haversine formula to calculate distance in KM
function getDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 0;
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const defaultHospitalPos = [30.7500, 76.8000];
const defaultUserPos = [30.7200, 76.7600];

function LiveTracking() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const { startRescue, updateRescueEta, endRescue } = useRescueStore();

  const [report, setReport] = useState(null);
  const [isLoadingReport, setIsLoadingReport] = useState(true);

  const isDemo = !reportId || reportId.startsWith('demo-');
  const isAssigned = !!report?.assignedRescuerId;


  // Fetch live report details periodically
  useEffect(() => {
    if (!reportId || reportId.startsWith('demo-')) {
      setIsLoadingReport(false);
      return;
    }

    const fetchReport = async () => {
      try {
        const response = await apiClient.get(`/reports/${reportId}`);
        setReport(response.data);
      } catch (err) {
        console.error("Error fetching report for live tracking:", err);
      } finally {
        setIsLoadingReport(false);
      }
    };

    fetchReport();
    const intervalId = setInterval(fetchReport, 2000); // Poll every 2s

    return () => clearInterval(intervalId);
  }, [reportId]);

  // Derive journeyStage and status from database report status
  useEffect(() => {
    if (isDemo || !report) return;

    if (report.status === 'REPORTED') {
      setJourneyStage('EN_ROUTE');
      setStatus('ASSIGNING RESCUER');
    } else if (report.status === 'ASSIGNED') {
      setJourneyStage('EN_ROUTE');
      setStatus('RESCUER ON THE WAY');
    } else if (report.status === 'RESCUED') {
      setJourneyStage('RESCUING');
      setStatus('RESCUE IN PROGRESS');
    } else if (report.status === 'TREATED' || report.status === 'ADOPTED') {
      setJourneyStage('RESCUING');
      setStatus('RESCUER REACHED CLINIC');
    }
  }, [report?.status, isDemo]);



  const reportUserPos = useMemo(() => {
    return report
      ? (report.location || [report.locationLat, report.locationLng])
      : defaultUserPos;
  }, [report, defaultUserPos]);

  const reportHospitalPos = useMemo(() => {
    const rescuerPartner = getPartner(report?.rescuer);
    const reportPartner = getPartner(report);
    return rescuerPartner?.lat && rescuerPartner?.lng
      ? [rescuerPartner.lat, rescuerPartner.lng]
      : reportPartner?.lat && reportPartner?.lng
        ? [reportPartner.lat, reportPartner.lng]
        : defaultHospitalPos;
  }, [report, defaultHospitalPos]);

  const [rescuerPos, setRescuerPos] = useState(reportHospitalPos);
  const [fullRoute, setFullRoute] = useState([]);
  const [journeyStage, setJourneyStage] = useState('EN_ROUTE');
  const [arrivalTime, setArrivalTime] = useState(10);
  const [status, setStatus] = useState('RESCUER ON THE WAY');
  const [progress, setProgress] = useState(0);
  const [isSimulating, setIsSimulating] = useState(isDemo); // Only simulate if it's a demo
  const [isFlipped, setIsFlipped] = useState(false);

  const socketRef = useRef();
  const routeIndexRef = useRef(0); // Use Ref for smooth interval movement

  const ambIconNormal = useMemo(() => createAmbulanceIcon(false), []);
  const ambIconFlipped = useMemo(() => createAmbulanceIcon(true), []);

  // Update starting position when report is loaded
  useEffect(() => {
    if (isLoadingReport) return;
    if (isDemo) return; // For demo, let the simulation drive rescuerPos
    if (report?.rescuerLat && report?.rescuerLng) {
      setRescuerPos([report.rescuerLat, report.rescuerLng]);
    } else {
      setRescuerPos(reportHospitalPos);
    }
  }, [report?.rescuerLat, report?.rescuerLng, reportHospitalPos, isLoadingReport, isDemo]);

  // Fetch Route from OSRM
  useEffect(() => {
    if (isLoadingReport) return;
    if (!isDemo && !isAssigned) return; // Do not fetch route if not assigned

    const fetchRoute = async () => {
      try {
        setFullRoute([]);
        const start = journeyStage === 'EN_ROUTE' ? reportHospitalPos : reportUserPos;
        const end = journeyStage === 'EN_ROUTE' ? reportUserPos : reportHospitalPos;

        const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.routes && data.routes[0]) {
          const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          setFullRoute(coords);
          routeIndexRef.current = 0; // Reset index ref
          setIsFlipped(journeyStage === 'RESCUING');

          if (isDemo) {
            setRescuerPos(coords[0]);
            setProgress(0);
          }
        }
      } catch (err) {
        console.error("Routing error:", err);
        setFullRoute([reportHospitalPos, reportUserPos]);
      }
    };

    fetchRoute();
    startRescue(reportId || 'demo-123', 'user', 10);
  }, [journeyStage, reportId, startRescue, isLoadingReport, isDemo, isAssigned, reportUserPos[0], reportUserPos[1], reportHospitalPos[0], reportHospitalPos[1]]);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);
    socketRef.current.emit('join-track', reportId || 'demo-123');

    socketRef.current.on('location-updated', (data) => {
      if (!isSimulating) {
        setRescuerPos([data.lat, data.lng]);
        if (data.arrivalTime) setArrivalTime(data.arrivalTime);
        if (data.stage) setJourneyStage(data.stage);
      }
    });

    return () => socketRef.current.disconnect();
  }, [reportId, isSimulating]);

  // Simulation Logic (Only for Demo flows)
  useEffect(() => {
    if (!isDemo || !isSimulating || fullRoute.length === 0) return;

    const interval = setInterval(() => {
      const idx = routeIndexRef.current;

      if (idx < fullRoute.length - 1) {
        const nextIndex = idx + 1;
        const nextPos = fullRoute[nextIndex];

        routeIndexRef.current = nextIndex;
        setRescuerPos(nextPos);

        const currentProgress = Math.round((nextIndex / (fullRoute.length - 1)) * 100);
        setProgress(currentProgress);

        socketRef.current.emit('update-location', {
          reportId: reportId || 'demo-123',
          lat: nextPos[0],
          lng: nextPos[1],
          stage: journeyStage,
          arrivalTime: Math.max(1, Math.round(10 - (currentProgress / 10)))
        });

        updateRescueEta(Math.max(1, Math.round(10 - (currentProgress / 10))));
      } else {
        // Destination Reached
        if (journeyStage === 'EN_ROUTE') {
          setJourneyStage('RESCUING');
          setStatus('RESCUE IN PROGRESS');
          setProgress(0);
        } else {
          setStatus('RESCUER REACHED CLINIC');
          setIsSimulating(false);
          endRescue();
        }
      }
    }, 400);

    return () => clearInterval(interval);
  }, [isSimulating, fullRoute, journeyStage, reportId, isDemo]);

  // Calculate dynamic progress percent
  const progressPercent = useMemo(() => {
    if (isDemo) {
      return progress;
    }
    if (!isAssigned) {
      return 0; // Progress is 0 if no rescuer assigned
    }
    const totalDist = getDistance(reportHospitalPos[0], reportHospitalPos[1], reportUserPos[0], reportUserPos[1]);
    if (totalDist <= 0) return 0;

    if (journeyStage === 'EN_ROUTE') {
      const currentDist = getDistance(rescuerPos[0], rescuerPos[1], reportUserPos[0], reportUserPos[1]);
      return Math.max(0, Math.min(100, Math.round(((totalDist - currentDist) / totalDist) * 100)));
    } else {
      // For 'RESCUING', rescuer is moving from User to Hospital.
      // Progress starts at 0% (at User) and goes to 100% (at Hospital).
      const distFromUser = getDistance(rescuerPos[0], rescuerPos[1], reportUserPos[0], reportUserPos[1]);
      return Math.max(0, Math.min(100, Math.round((distFromUser / totalDist) * 100)));
    }
  }, [isDemo, isAssigned, progress, reportHospitalPos, reportUserPos, rescuerPos, journeyStage]);

  const leftPosition = journeyStage === 'EN_ROUTE'
    ? Math.max(5, Math.min(95, 100 - progressPercent))
    : Math.max(5, Math.min(95, progressPercent));

  // Determine display status details dynamically
  let displayStatus = status;
  let displayArrivalTime = `ARRIVING IN ${arrivalTime} MINS`;

  if (!isDemo && !isAssigned) {
    displayStatus = 'ASSIGNING RESCUER';
    displayArrivalTime = 'WAITING FOR RESCUER TO ACCEPT';
  } else if (!isDemo && isAssigned) {
    if (journeyStage === 'EN_ROUTE') {
      displayStatus = 'RESCUER ON THE WAY';
      const dist = getDistance(rescuerPos[0], rescuerPos[1], reportUserPos[0], reportUserPos[1]);
      const mins = Math.max(1, Math.ceil((dist / 40) * 60)); // assume 40km/h avg speed
      displayArrivalTime = `ARRIVING IN ${mins} MINS`;
    } else if (journeyStage === 'RESCUING') {
      displayStatus = 'RESCUE IN PROGRESS';
      displayArrivalTime = 'HEADING TO CLINIC';
    } else {
      displayStatus = 'RESCUER REACHED CLINIC';
      displayArrivalTime = 'RESCUE COMPLETED';
    }
  }

  // Determine rescuer details dynamically
  const rescuerName = report?.rescuer?.name || (isDemo ? 'Dr. Aman Sharma' : 'Assigning Rescuer...');
  const rescuerContact = report?.rescuer?.phone || report?.rescuer?.contact || (isDemo ? '+91 98765 43210' : 'N/A');
  const clinicName = getPartner(report?.rescuer)?.name || getPartner(report)?.name || (isDemo ? 'StrayCare North Center' : 'Pending Association...');
  const rescuerAvatarUrl = report?.rescuer?.avatarUrl;
  const isRescueCompleted = report && (report.status === 'TREATED' || report.status === 'ADOPTED');
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    if (!reportId) return;
    navigator.clipboard.writeText(reportId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isRescueCompleted) {
    return (
      <div className="rescue-completed-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 80px)',
        background: '#fcfdfa',
        fontFamily: "'Outfit', sans-serif",
        padding: '40px 20px'
      }}>
        <div style={{
          background: 'white',
          width: '100%',
          maxWidth: '550px',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.06)',
          textAlign: 'center',
          border: '1px solid #e8f0e0'
        }}>

          <h1 style={{
            fontSize: '1.8rem',
            fontWeight: '700',
            color: '#1a1a1a',
            margin: '0 0 12px 0'
          }}>
            Rescue Mission Completed!
          </h1>

          <p style={{
            color: '#555',
            fontSize: '1rem',
            lineHeight: '1.6',
            margin: '0 0 30px 0'
          }}>
            The reported animal has been safely picked up and admitted to our partner veterinary clinic. Thanks to your prompt action, they are now receiving the care and treatment they need.
          </p>

          <div style={{
            background: '#fafbfc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '30px',
            textAlign: 'left'
          }}>
            <span style={{
              fontSize: '0.85rem',
              fontWeight: '700',
              color: '#718096',
              display: 'block',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Tracking & Report ID
            </span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                readOnly
                value={reportId}
                style={{
                  flex: 1,
                  background: 'white',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontFamily: 'monospace',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  color: '#334155',
                  outline: 'none'
                }}
              />
              <button
                onClick={handleCopyId}
                style={{
                  background: copied ? '#346c02' : '#ffd21e',
                  color: copied ? 'white' : '#000',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  minWidth: '90px'
                }}
              >
                {copied ? 'Copied!' : 'Copy ID'}
              </button>
            </div>
            <span style={{
              fontSize: '0.8rem',
              color: '#718096',
              display: 'block',
              marginTop: '12px',
              lineHeight: '1.4'
            }}>
              ℹ️ This ID is saved inside your **Profile section** under **'My Reports'**. Use it on the track page below to check progress.
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => navigate('/track', { state: { trackingId: reportId } })}
              style={{
                width: '100%',
                background: '#346c02',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '14px',
                fontWeight: '600',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              Track Progress
            </button>
            <button
              onClick={() => navigate('/')}
              style={{
                width: '100%',
                background: 'transparent',
                color: '#346c02',
                border: '1px solid #346c02',
                borderRadius: '10px',
                padding: '12px',
                fontWeight: '600',
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Furzo - Live Tracking</title>
        <meta name="description" content="Follow your rescue in real-time. Track the rescuer's live location as they reach the animal and transport it to a care center." />
      </Helmet>
      <div className="live-tracking-page">
        <div className="tracking-header">
          <div className="hospital-track">
            <img src={pickupImg} className="track-img start" alt="pickup" />
            <div
              className="hospital-track-progress"
              style={{
                width: `${progressPercent}%`,
                left: journeyStage === 'RESCUING' ? '0' : 'auto',
                right: journeyStage === 'EN_ROUTE' ? '0' : 'auto'
              }}
            ></div>
            {isAssigned || isDemo ? (
              <img
                src={ambulanceImg}
                className={`track-img rescuer-img ${isFlipped ? 'flipped' : ''}`}
                style={{ left: `${leftPosition}%` }}
                alt="rescuer"
              />
            ) : null}
            <img src={hospitalImg} className="track-img end" alt="hospital" />
          </div>
        </div>

        <div className="tracking-grid">
          <div className="tracking-left">
            <div className="tracking-status-card">
              <h2>{displayStatus}</h2>
              <div className="arrival-time">
                {displayArrivalTime}
              </div>
            </div>

            <div className="info-card">
              <div className="rescuer-avatar-container">
                {rescuerAvatarUrl ? (
                  <img src={rescuerAvatarUrl} alt="Rescuer" className="rescuer-avatar" />
                ) : isDemo ? (
                  <img src={rescuerAvatar} alt="Rescuer" className="rescuer-avatar" />
                ) : (
                  <User className="default-avatar-icon" />
                )}
              </div>
              <div className="details-content">
                <h3>{rescuerName}</h3>
                <p className="specialty">Certified Lead Rescuer</p>

                <div className="details-grid">
                  <div className="detail-item">
                    <strong>Clinic:</strong> <span>{clinicName}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Contact:</strong> <span>{rescuerContact}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Status:</strong> <span>{(!isDemo && !isAssigned) ? 'Assigning...' : (journeyStage === 'EN_ROUTE' ? 'En route to you' : 'Heading to clinic')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="tracking-right">
            <div className="map-container">
              <MapContainer center={rescuerPos} zoom={14} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                {fullRoute.length > 0 && (isAssigned || isDemo) && (
                  <Polyline positions={fullRoute} color="#8BC34A" weight={6} opacity={0.8} />
                )}

                <Marker position={reportUserPos} icon={userIcon}><Popup>Your Location</Popup></Marker>
                <Marker position={reportHospitalPos} icon={hospitalIcon}><Popup>Clinic</Popup></Marker>

                {/* Force rescuer marker to be on top with higher zIndexOffset */}
                {(isAssigned || isDemo) && (
                  <Marker
                    position={rescuerPos}
                    icon={isFlipped ? ambIconFlipped : ambIconNormal}
                    zIndexOffset={1000}
                  >
                    <Popup>Rescuer ({journeyStage === 'EN_ROUTE' ? 'To You' : 'To Clinic'})</Popup>
                  </Marker>
                )}

                <MapRecenter center={rescuerPos} />
              </MapContainer>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => { map.panTo(center, { animate: true, duration: 0.3 }); }, [center, map]);
  return null;
}

export default LiveTracking;

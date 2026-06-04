import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useRescueStore } from '../../store/rescueStore';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import io from 'socket.io-client';
import '../../styles/user/LiveTracking.css';

// Asset Imports
import ambulanceImg from '../../assets/images/ambulance.png';
import hospitalImg from "../../assets/images/Hospital.png";
import pickupImg from '../../assets/images/Pickup.png';
import rescuerAvatar from '../../assets/images/doctor-open.png';

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

const hospitalIcon = new L.Icon({ iconUrl: hospitalImg, iconSize: [50, 50], iconAnchor: [25, 50] });
const userIcon = new L.Icon({ iconUrl: pickupImg, iconSize: [45, 45], iconAnchor: [22, 45] });

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

function LiveTracking() {
  const { reportId } = useParams();
  const { startRescue, updateRescueEta, endRescue } = useRescueStore();

  const hospitalPos = [30.7500, 76.8000];
  const userPos = [30.7200, 76.7600];

  const [rescuerPos, setRescuerPos] = useState(hospitalPos);
  const [fullRoute, setFullRoute] = useState([]);
  const [journeyStage, setJourneyStage] = useState('EN_ROUTE');
  const [arrivalTime, setArrivalTime] = useState(10);
  const [status, setStatus] = useState('RESCUER ON THE WAY');
  const [progress, setProgress] = useState(0);
  const [isSimulating, setIsSimulating] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);

  const socketRef = useRef();
  const routeIndexRef = useRef(0); // Use Ref for smooth interval movement

  const ambIconNormal = useMemo(() => createAmbulanceIcon(false), []);
  const ambIconFlipped = useMemo(() => createAmbulanceIcon(true), []);

  // Fetch Route from OSRM
  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const start = journeyStage === 'EN_ROUTE' ? hospitalPos : userPos;
        const end = journeyStage === 'EN_ROUTE' ? userPos : hospitalPos;

        const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.routes && data.routes[0]) {
          const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          setFullRoute(coords);
          routeIndexRef.current = 0; // Reset index ref
          setRescuerPos(coords[0]);
          setProgress(0);
          setIsFlipped(journeyStage === 'RESCUING');
        }
      } catch (err) {
        console.error("Routing error:", err);
        setFullRoute([hospitalPos, userPos]);
      }
    };

    fetchRoute();
    startRescue(reportId || 'demo-123', 'user', 10);
  }, [journeyStage, reportId, startRescue]);

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

  // Simulation Logic
  useEffect(() => {
    if (!isSimulating || fullRoute.length === 0) return;

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
        } else {
          setStatus('RESCUER REACHED CLINIC');
          setIsSimulating(false);
          endRescue();
        }
      }
    }, 400);

    return () => clearInterval(interval);
  }, [isSimulating, fullRoute, journeyStage, reportId]);

  const leftPosition = journeyStage === 'EN_ROUTE'
    ? Math.max(5, Math.min(95, 100 - progress))
    : Math.max(5, Math.min(95, progress));

  return (
    <div className="live-tracking-page">
      <div className="tracking-header">
        <div className="hospital-track">
          <img src={pickupImg} className="track-img start" alt="pickup" />
          <div
            className="hospital-track-progress"
            style={{
              width: `${progress}%`,
              left: journeyStage === 'RESCUING' ? '0' : 'auto',
              right: journeyStage === 'EN_ROUTE' ? '0' : 'auto'
            }}
          ></div>
          <img
            src={ambulanceImg}
            className={`track-img rescuer-img ${isFlipped ? 'flipped' : ''}`}
            style={{ left: `${leftPosition}%` }}
            alt="rescuer"
          />
          <img src={hospitalImg} className="track-img end" alt="hospital" />
        </div>
      </div>

      <div className="tracking-grid">
        <div className="tracking-left">
          <div className="status-card">
            <h2>{status}</h2>
            <div className="arrival-time">
              {journeyStage === 'EN_ROUTE' ?
                `ARRIVING IN ${Math.max(1, 10 - Math.floor(progress / 10))} MINS` :
                'HEADING TO CLINIC'}
            </div>
          </div>

          <div className="info-card">
            <div className="rescuer-avatar-container">
              <img src={rescuerAvatar} alt="Rescuer" className="rescuer-avatar" />
            </div>
            <div className="details-content">
              <h3>Dr. Aman Sharma</h3>
              <p className="specialty">Certified Lead Rescuer</p>

              <div className="details-grid">
                <div className="detail-item">
                  <strong>Vehicle:</strong> <span>Ambulance CH01-SC-2024</span>
                </div>
                <div className="detail-item">
                  <strong>Clinic:</strong> <span>StrayCare North Center</span>
                </div>
                <div className="detail-item">
                  <strong>Contact:</strong> <span>+91 98765 43210</span>
                </div>
                <div className="detail-item">
                  <strong>Status:</strong> <span>{journeyStage === 'EN_ROUTE' ? 'En route to you' : 'Heading to clinic'}</span>
                </div>
              </div>
            </div>
          </div>

          <button className="sim-toggle-btn" onClick={() => setIsSimulating(!isSimulating)}>
            {isSimulating ? 'Pause Simulation' : 'Resume Simulation'}
          </button>
        </div>

        <div className="tracking-right">
          <div className="map-container">
            <MapContainer center={rescuerPos} zoom={14} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />

              {fullRoute.length > 0 && (
                <Polyline positions={fullRoute} color="#8BC34A" weight={6} opacity={0.8} />
              )}

              <Marker position={userPos} icon={userIcon}><Popup>Your Location</Popup></Marker>
              <Marker position={hospitalPos} icon={hospitalIcon}><Popup>Clinic</Popup></Marker>

              {/* Force rescuer marker to be on top with higher zIndexOffset */}
              <Marker
                position={rescuerPos}
                icon={isFlipped ? ambIconFlipped : ambIconNormal}
                zIndexOffset={1000}
              >
                <Popup>Rescuer ({journeyStage === 'EN_ROUTE' ? 'To You' : 'To Clinic'})</Popup>
              </Marker>

              <MapRecenter center={rescuerPos} />
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => { map.panTo(center, { animate: true, duration: 0.3 }); }, [center, map]);
  return null;
}

export default LiveTracking;

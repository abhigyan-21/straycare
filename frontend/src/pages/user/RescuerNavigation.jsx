import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRescue } from '../../context/RescueContext';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import '../../styles/user/RescuerPages.css';

// Reuse Icons from LiveTracking
import ambulanceImg from '../../assets/images/ambulance.png';
import hospitalImg from '../../assets/images/Hospital.png';
import pickupImg from '../../assets/images/Pickup.png';

const ambulanceIcon = new L.Icon({ iconUrl: ambulanceImg, iconSize: [60, 40], iconAnchor: [30, 20] });
const hospitalIcon = new L.Icon({ iconUrl: hospitalImg, iconSize: [50, 50], iconAnchor: [25, 50] });
const strayIcon = new L.Icon({ iconUrl: pickupImg, iconSize: [45, 45], iconAnchor: [22, 45] });

const MOCK_REPORTS = {
  'rescue-101': { type: 'Dog', description: 'Injured limb, Sector 1', location: [30.7420, 76.8188], reporter: 'Rahul Singh', contact: '+91 91234 56789' },
  'rescue-102': { type: 'Cat', description: 'Stuck in pipe, Sector 17', location: [30.7333, 76.7794], reporter: 'Anjali Sharma', contact: '+91 99887 76655' },
  'rescue-103': { type: 'Puppy', description: 'High fever, Mohali', location: [30.7046, 76.7179], reporter: 'Vikram Mehta', contact: '+91 98765 12345' },
};

const HOSPITAL_POS = [30.7500, 76.8000];

function RescuerNavigation() {
  const { reportId } = useParams();
  const { startRescue, updateRescueEta, endRescue } = useRescue();
  const navigate = useNavigate();
  const report = MOCK_REPORTS[reportId] || MOCK_REPORTS['rescue-101'];

  const [rescuerPos, setRescuerPos] = useState([30.7200, 76.7600]); // Mock starting pos
  const [stage, setStage] = useState('TO_STRAY'); // 'TO_STRAY' or 'TO_HOSPITAL'
  const [route, setRoute] = useState([]);
  const [isDriving, setIsDriving] = useState(false);
  const routeIndexRef = useRef(0);

  // Fetch Route from OSRM
  useEffect(() => {
    const fetchRoute = async () => {
      const start = rescuerPos;
      const end = stage === 'TO_STRAY' ? report.location : HOSPITAL_POS;
      
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.routes && data.routes[0]) {
          const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          setRoute(coords);
          routeIndexRef.current = 0;
        }
      } catch (err) {
        console.error("Routing error:", err);
      }
    };
    fetchRoute();
    startRescue(reportId || 'rescue-101', 'rescuer', 8);
  }, [stage, report.location, reportId, startRescue]);

  // Driving Simulation
  useEffect(() => {
    if (!isDriving || route.length === 0) return;

    const interval = setInterval(() => {
      const idx = routeIndexRef.current;
      if (idx < route.length - 1) {
        const nextIdx = idx + 1;
        setRescuerPos(route[nextIdx]);
        routeIndexRef.current = nextIdx;
        
        // Update ETA (Simple mock calculation based on remaining route distance)
        const remainingIdx = route.length - nextIdx;
        const estimatedMins = Math.max(1, Math.ceil(remainingIdx / 10));
        updateRescueEta(estimatedMins);
      } else {
        setIsDriving(false);
        if (stage === 'TO_STRAY') {
          alert("You have reached the stray animal!");
        } else {
          alert("You have reached the hospital!");
          navigate('/rescuer/dashboard');
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isDriving, route, stage, navigate]);

  return (
    <div className="rescuer-nav-page">
      <div className="patient-panel">
        <h2>Patient Details</h2>
        <div className="patient-pic-large">
          pet pic
        </div>

        <div className="patient-info-list">
          <div className="detail-block">
            <strong>Reported By:</strong>
            <p>{report.reporter}</p>
          </div>
          <div className="detail-block">
            <strong>Report:</strong>
            <p>{report.type}: {report.description}</p>
          </div>
          <div className="detail-block">
            <strong>Location:</strong>
            <p>{report.address || 'Live GPS Location'}</p>
          </div>
          <div className="detail-block">
            <strong>Contact:</strong>
            <p>{report.contact}</p>
          </div>
        </div>

        <div className="nav-actions">
          {stage === 'TO_STRAY' ? (
            <button className="confirm-pickup-btn" onClick={() => setStage('TO_HOSPITAL')}>
              Confirm Pickup
            </button>
          ) : (
            <button className="confirm-pickup-btn" style={{background: '#2196F3'}} onClick={() => { endRescue(); navigate('/rescuer/dashboard'); }}>
              Rescue Completed
            </button>
          )}
          <button className="sim-toggle-btn" onClick={() => setIsDriving(!isDriving)}>
            {isDriving ? 'Pause Navigation' : 'Start Driving'}
          </button>
        </div>
      </div>

      <div className="nav-map-container">
        <MapContainer center={rescuerPos} zoom={15} style={{ height: '100%', width: '100%' }}>
          <TileLayer 
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; CARTO'
          />
          
          {route.length > 0 && (
            <Polyline positions={route} color={stage === 'TO_STRAY' ? '#2196F3' : '#3eba11'} weight={6} />
          )}

          <Marker position={report.location} icon={strayIcon}><Popup>Stray Animal</Popup></Marker>
          <Marker position={HOSPITAL_POS} icon={hospitalIcon}><Popup>Clinic</Popup></Marker>
          <Marker position={rescuerPos} icon={ambulanceIcon} zIndexOffset={1000}><Popup>Your Location</Popup></Marker>
          
          <MapRecenter center={rescuerPos} />
        </MapContainer>

        <div className="map-overlay-info">
          <div>Next Step: <strong>{stage === 'TO_STRAY' ? 'Reach the Animal' : 'Head to Hospital'}</strong></div>
          <div>Dist: <strong>{stage === 'TO_STRAY' ? '1.2 km' : '3.4 km'}</strong></div>
        </div>
      </div>
    </div>
  );
}

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => { map.panTo(center, { animate: true, duration: 0.5 }); }, [center, map]);
  return null;
}

export default RescuerNavigation;

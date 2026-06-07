import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRescueStore } from '../../store/rescueStore';
import { useAuthStore } from '../../store/authStore';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import '../../styles/user/RescuerPages.css';
import apiClient from '../../services/api';
import ActionLoader from '../../components/ActionLoader';

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
  const { startRescue, updateRescueEta, endRescue } = useRescueStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rescuerPos, setRescuerPos] = useState([30.7200, 76.7600]); // Mock starting pos, updated via geolocation
  const [stage, setStage] = useState('TO_STRAY'); // 'TO_STRAY' or 'TO_HOSPITAL'
  const [route, setRoute] = useState([]);
  const [isDriving, setIsDriving] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState('Fetching location address...');
  const routeIndexRef = useRef(0);

  // Fetch live report details
  useEffect(() => {
    const fetchReport = async () => {
      setIsLoading(true);
      // Check if it's a mock report id
      if (reportId && (reportId.startsWith('rescue-10') || reportId.startsWith('demo-'))) {
        const mock = MOCK_REPORTS[reportId] || MOCK_REPORTS['rescue-101'];
        setReport({
          id: reportId,
          type: mock.type,
          description: mock.description,
          location: mock.location,
          reporter: { name: mock.reporter, phone: mock.contact },
          address: mock.address || 'Mock Address'
        });
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiClient.get(`/reports/${reportId}`);
        setReport(response.data);
      } catch (err) {
        console.error("Error fetching report from API:", err);
        // Fallback to mock
        const mock = MOCK_REPORTS['rescue-101'];
        setReport({
          id: 'rescue-101',
          type: mock.type,
          description: mock.description,
          location: mock.location,
          reporter: { name: mock.reporter, phone: mock.contact },
          address: mock.address || 'Mock Address'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [reportId]);

  // Geolocation for rescuer starting position
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setRescuerPos([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Error getting live geolocation for rescuer navigation:", error);
        }
      );
    }
  }, []);

  // Compute location arrays safely
  const reportLocation = report 
    ? (report.location || [report.locationLat, report.locationLng])
    : null;

  const hospitalLocation = report?.rescuer?.clinic?.lat && report?.rescuer?.clinic?.lng
    ? [report.rescuer.clinic.lat, report.rescuer.clinic.lng]
    : user?.clinic?.lat && user?.clinic?.lng
    ? [user.clinic.lat, user.clinic.lng]
    : report?.clinic?.lat && report?.clinic?.lng
    ? [report.clinic.lat, report.clinic.lng]
    : HOSPITAL_POS;

  // Resolve human-readable address
  useEffect(() => {
    if (!report) return;
    if (report.address) {
      setResolvedAddress(report.address);
      return;
    }
    const lat = report.locationLat !== undefined ? report.locationLat : report.location?.[0];
    const lng = report.locationLng !== undefined ? report.locationLng : report.location?.[1];
    if (!lat || !lng) {
      setResolvedAddress('No coordinates provided');
      return;
    }
    const fetchAddress = async () => {
      try {
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
        const data = await response.json();
        setResolvedAddress(`${data.locality || data.city || 'Unknown Location'}, ${data.principalSubdivision || data.countryName}`);
      } catch (err) {
        setResolvedAddress(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
      }
    };
    fetchAddress();
  }, [report]);

  // Fetch Route from OSRM
  useEffect(() => {
    if (!reportLocation) return;
    
    const fetchRoute = async () => {
      const start = rescuerPos;
      const end = stage === 'TO_STRAY' ? reportLocation : hospitalLocation;
      
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
  }, [stage, reportLocation, hospitalLocation, reportId, startRescue, rescuerPos]);

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
          handleRescueCompleted();
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isDriving, route, stage]);

  const handleConfirmPickup = async () => {
    if (!reportId || reportId.startsWith('rescue-10') || reportId.startsWith('demo-')) {
      setStage('TO_HOSPITAL');
      return;
    }
    try {
      await apiClient.patch(`/reports/${reportId}/status`, { status: 'RESCUED' });
      setStage('TO_HOSPITAL');
    } catch (err) {
      console.error("Error setting report status to RESCUED:", err);
      setStage('TO_HOSPITAL');
    }
  };

  const handleRescueCompleted = async () => {
    if (!reportId || reportId.startsWith('rescue-10') || reportId.startsWith('demo-')) {
      endRescue();
      navigate('/rescuer/dashboard');
      return;
    }
    try {
      await apiClient.patch(`/reports/${reportId}/status`, { status: 'TREATED' });
    } catch (err) {
      console.error("Error setting report status to TREATED:", err);
    } finally {
      endRescue();
      navigate('/rescuer/dashboard');
    }
  };

  if (isLoading || !report) {
    return <ActionLoader message="Loading navigation console..." />;
  }

  return (
    <div className="rescuer-nav-page">
      <div className="patient-panel">
        <h2>Patient Details</h2>
        <div className="patient-pic-large">
          {report.mediaUrls && report.mediaUrls[0] ? (
            <img src={report.mediaUrls[0]} alt="pet preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
          ) : (
            'pet pic'
          )}
        </div>

        <div className="patient-info-list">
          <div className="detail-block">
            <strong>Reported By:</strong>
            <p>{report.reporter?.name || 'Anonymous'}</p>
          </div>
          <div className="detail-block">
            <strong>Report:</strong>
            <p>{report.type ? `${report.type}: ` : ''}{report.description}</p>
          </div>
          <div className="detail-block">
            <strong>Location:</strong>
            <p>{resolvedAddress}</p>
          </div>
          <div className="detail-block">
            <strong>Contact:</strong>
            <p>{report.reporter?.phone || 'N/A'}</p>
          </div>
        </div>

        <div className="nav-actions">
          {stage === 'TO_STRAY' ? (
            <button className="confirm-pickup-btn" onClick={handleConfirmPickup}>
              Confirm Pickup
            </button>
          ) : (
            <button className="confirm-pickup-btn" style={{background: '#2196F3'}} onClick={handleRescueCompleted}>
              Rescue Completed
            </button>
          )}
          <button className="sim-toggle-btn" onClick={() => setIsDriving(!isDriving)}>
            {isDriving ? 'Pause Navigation' : 'Start Driving'}
          </button>
        </div>
      </div>

      <div className="nav-map-container">
        {reportLocation && (
          <MapContainer center={rescuerPos} zoom={15} style={{ height: '100%', width: '100%' }}>
            <TileLayer 
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; CARTO'
            />
            
            {route.length > 0 && (
              <Polyline positions={route} color={stage === 'TO_STRAY' ? '#2196F3' : '#3eba11'} weight={6} />
            )}

            <Marker position={reportLocation} icon={strayIcon}><Popup>Stray Animal</Popup></Marker>
            <Marker position={hospitalLocation} icon={hospitalIcon}><Popup>Clinic</Popup></Marker>
            <Marker position={rescuerPos} icon={ambulanceIcon} zIndexOffset={1000}><Popup>Your Location</Popup></Marker>
            
            <MapRecenter center={rescuerPos} />
          </MapContainer>
        )}

        <div className="map-overlay-info">
          <div>Next Step: <strong>{stage === 'TO_STRAY' ? 'Reach the Animal' : 'Head to Hospital'}</strong></div>
          <div>Stage: <strong>{stage === 'TO_STRAY' ? 'To Stray' : 'To Clinic'}</strong></div>
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

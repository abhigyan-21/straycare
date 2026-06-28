import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { useRescueStore } from '../../store/rescueStore';
import { useAuthStore } from '../../store/authStore';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import '../../styles/user/RescuerPages.css';
import apiClient, { getPartner } from '../../services/api';
import ActionLoader from '../../components/ActionLoader';

// Reuse Icons from LiveTracking
import ambulanceImg from '../../assets/images/ambulance.webp';
import hospitalImg from '../../assets/images/Hospital.webp';
import pickupImg from '../../assets/images/Pickup.webp';

const ambulanceIcon = new L.Icon({ iconUrl: ambulanceImg, iconSize: [60, 40], iconAnchor: [30, 20] });
const hospitalIcon = new L.Icon({ iconUrl: hospitalImg, iconSize: [50, 50], iconAnchor: [25, 50] });
const strayIcon = new L.Icon({ iconUrl: pickupImg, iconSize: [45, 45], iconAnchor: [22, 45] });

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function RescuerNavigation() {
  const { reportId } = useParams();
  const { startRescue, updateRescueEta, endRescue } = useRescueStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rescuerPos, setRescuerPos] = useState([30.7200, 76.7600]); // Mock starting pos, updated via geolocation
  const [initialPos, setInitialPos] = useState(null);
  const [stage, setStage] = useState('TO_STRAY'); // 'TO_STRAY' or 'TO_HOSPITAL'
  const [route, setRoute] = useState([]);
  const [resolvedAddress, setResolvedAddress] = useState('Fetching location address...');
  const [nearestClinic, setNearestClinic] = useState(null);

  // Fetch live report details
  useEffect(() => {
    if (!reportId) return;

    const fetchReport = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get(`/reports/${reportId}`);
        setReport(response.data);
        if (response.data?.status === 'RESCUED') {
          setStage('TO_HOSPITAL');
        }
      } catch (err) {
        console.error("Error fetching report from API:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [reportId]);

  // Geolocation for rescuer real-time position tracking
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      console.warn("Geolocation is not supported by this browser");
      return;
    }

    const handleSuccess = (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setRescuerPos([lat, lng]);
      setInitialPos(prev => prev || [lat, lng]);
    };

    const handleError = (error) => {
      console.error("Error watching live geolocation for rescuer navigation:", error);
    };

    const options = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000
    };

    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by your browser");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, options);

    return () => {
      if (navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Compute location arrays safely
  const reportLocation = report
    ? (report.location || [report.locationLat, report.locationLng])
    : null;

  const rescuerPartner = getPartner(report?.rescuer);
  const userPartner = getPartner(user);
  const reportPartner = getPartner(report);
  const assignedHospitalLocation = rescuerPartner?.lat && rescuerPartner?.lng
    ? [rescuerPartner.lat, rescuerPartner.lng]
    : userPartner?.lat && userPartner?.lng
      ? [userPartner.lat, userPartner.lng]
      : reportPartner?.lat && reportPartner?.lng
        ? [reportPartner.lat, reportPartner.lng]
        : null;

  const hospitalLocation = assignedHospitalLocation || (nearestClinic ? [nearestClinic.lat, nearestClinic.lng] : null);

  // Fetch nearest clinic if none is explicitly assigned
  useEffect(() => {
    if (assignedHospitalLocation) return;
    if (!reportLocation) return;

    const fetchNearestClinic = async () => {
      try {
        const response = await apiClient.get('/reports/clinics');
        const clinics = response.data;
        if (clinics && clinics.length > 0) {
          let nearest = null;
          let minDistance = Infinity;
          for (const clinic of clinics) {
            const dist = getDistance(reportLocation[0], reportLocation[1], clinic.lat, clinic.lng);
            if (dist < minDistance) {
              minDistance = dist;
              nearest = clinic;
            }
          }
          setNearestClinic(nearest);
        }
      } catch (err) {
        console.error("Error fetching nearest clinic:", err);
      }
    };
    fetchNearestClinic();
  }, [assignedHospitalLocation, reportLocation]);

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

  // Start rescue session on mount
  useEffect(() => {
    if (reportId) {
      startRescue(reportId, 'rescuer', 8);
    }
  }, [reportId, startRescue]);

  // Update live coordinates in database
  useEffect(() => {
    if (!reportId) return;

    const updateDBLocation = async () => {
      try {
        await apiClient.patch(`/reports/${reportId}/location`, {
          lat: rescuerPos[0],
          lng: rescuerPos[1]
        });
      } catch (err) {
        console.error("Error updating location in DB:", err);
      }
    };

    // Debounce/Throttle to avoid overloading (update every 1 second while driving)
    const timer = setTimeout(updateDBLocation, 1000);
    return () => clearTimeout(timer);
  }, [rescuerPos[0], rescuerPos[1], reportId]);

  // Fetch Route from OSRM (using static initial position to avoid rate limits)
  useEffect(() => {
    if (!reportLocation || !initialPos) return;

    const fetchRoute = async () => {
      const start = initialPos;
      const end = stage === 'TO_STRAY' ? reportLocation : hospitalLocation;

      if (!start || !end) return;

      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.routes && data.routes[0]) {
          const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          setRoute(coords);
        }
      } catch (err) {
        console.error("Routing error:", err);
      }
    };
    fetchRoute();
  }, [
    stage,
    reportLocation?.[0],
    reportLocation?.[1],
    hospitalLocation?.[0],
    hospitalLocation?.[1],
    initialPos?.[0],
    initialPos?.[1]
  ]);

  const handleOpenGoogleMaps = () => {
    const destination = stage === 'TO_STRAY' ? reportLocation : hospitalLocation;
    if (!destination) return;

    const url = `https://www.google.com/maps/dir/?api=1&origin=${rescuerPos[0]},${rescuerPos[1]}&destination=${destination[0]},${destination[1]}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const handleConfirmPickup = async () => {
    if (!reportId) return;
    try {
      await apiClient.patch(`/reports/${reportId}/status`, { status: 'RESCUED' });
      setStage('TO_HOSPITAL');
    } catch (err) {
      console.error("Error setting report status to RESCUED:", err);
      setStage('TO_HOSPITAL');
    }
  };

  const handleRescueCompleted = async () => {
    if (!reportId) return;
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
    <>
      <Helmet>
        <title>Furzo - Rescuer Navigation</title>
        <meta name="description" content="Navigate to the animal's location and transport it safely to the clinic with Furzo's real-time rescuer navigation." />
      </Helmet>
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
              <button className="confirm-pickup-btn" style={{ background: '#2196F3' }} onClick={handleRescueCompleted}>
                Rescue Completed
              </button>
            )}
            <button className="google-maps-btn" onClick={handleOpenGoogleMaps}>
              Navigate with Google Maps
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
              {hospitalLocation && (
                <Marker position={hospitalLocation} icon={hospitalIcon}><Popup>Clinic</Popup></Marker>
              )}
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
    </>
  );
}

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => { map.panTo(center, { animate: true, duration: 0.5 }); }, [center, map]);
  return null;
}

export default RescuerNavigation;

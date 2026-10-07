import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { User, Phone, MapPin, Ambulance, Info, ArrowLeft, FileText } from 'lucide-react';
import '../../styles/vet/VetTracking.css';
import apiClient, { getPartner } from '../../services/api';
import ActionLoader from '../../components/ActionLoader';
import AIVisionInsights from '../../components/AIVisionInsights';

// Icons
import ambulanceImg from '../../assets/images/ambulance.webp';
import hospitalImg from '../../assets/images/Hospital.webp';
import pickupImg from '../../assets/images/Pickup.webp';

const ambulanceIcon = new L.Icon({ iconUrl: ambulanceImg, iconSize: [60, 40], iconAnchor: [30, 20] });
const hospitalIcon = new L.Icon({ iconUrl: hospitalImg, iconSize: [50, 50], iconAnchor: [25, 50] });
const strayIcon = new L.Icon({ iconUrl: pickupImg, iconSize: [45, 45], iconAnchor: [22, 45] });

function VetTracking() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [rescuerPos, setRescuerPos] = useState([30.7200, 76.7600]);
  const [hospitalPos, setHospitalPos] = useState([30.7500, 76.8000]);
  const [route, setRoute] = useState([]);
  const [eta, setEta] = useState(12);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await apiClient.get(`/reports/${id}`);
        const data = response.data;
        const partner = getPartner(data);
        setReport({
          id: data.id.substring(0, 8).toUpperCase(),
          type: data.pet?.breed || 'Stray Animal',
          description: data.description,
          location: [data.locationLat, data.locationLng],
          reporter: data.reporter?.name || 'Anonymous',
          contact: data.reporter?.contact || 'N/A',
          status: data.status,
          rescuer: data.rescuer
        });

        if (data.rescuerLat && data.rescuerLng) {
          setRescuerPos([data.rescuerLat, data.rescuerLng]);
        }

        if (partner?.lat && partner?.lng) {
          setHospitalPos([partner.lat, partner.lng]);
        }
      } catch (err) {
        console.error("Failed to fetch live report tracking details:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  useEffect(() => {
    if (!report) return;

    const fetchRoute = async () => {
      const start = rescuerPos;
      const end = report.location;
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes && data.routes[0]) {
          const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          setRoute(coords);
          setEta(Math.ceil(data.routes[0].duration / 60));
        }
      } catch (err) {
        console.error("Routing error:", err);
      }
    };
    fetchRoute();
  }, [report, rescuerPos]);

  if (isLoading) {
    return <ActionLoader message="Syncing GPS tracking coordinates..." />;
  }

  if (!report) {
    return (
      <div className="vet-tracking-page" style={{ padding: '50px', textAlign: 'center' }}>
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>
        <h2 style={{ marginTop: '20px' }}>Report not found or tracking not initialized.</h2>
      </div>
    );
  }

  // Driver details populated dynamically from the backend report.rescuer details
  const driver = {
    name: report.rescuer?.name || "Sunil Kumar",
    phone: report.rescuer?.contact || report.rescuer?.email || "+91 88776 65544",
    vehicle: "Ambulance Vehicle",
    status: report.status === 'ASSIGNED' ? "Heading to Stray" : report.status.toLowerCase().replace('_', ' ')
  };

  return (
    <>
      <Helmet>
        <title>Furzo Vet Portal - Live Tracking</title>
        <meta name="description" content="Monitor the live GPS location of rescuers transporting animals to your clinic on the Furzo Vet Portal." />
      </Helmet>
      <div className="vet-tracking-page">
        <div className="tracking-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>
          <h1>Rescue Tracking: {report.id}</h1>
        </div>

        <div className="tracking-container">
          {/* Sidebar Info */}
          <div className="tracking-sidebar">
            <div className="eta-card">
              <span className="eta-label">Estimated Time to Arrival</span>
              <span className="eta-value">{eta} mins</span>
            </div>
            <div className="tracking-card">
              <h3 className="card-title"><Ambulance size={18} /> Driver Details</h3>
              <div className="driver-info">
                <div className="info-row">
                  <User size={16} />
                  <div>
                    <span className="label">Rescuer Name</span>
                    <span className="value">{driver.name}</span>
                  </div>
                </div>
                <div className="info-row">
                  <Phone size={16} />
                  <div>
                    <span className="label">Contact</span>
                    <span className="value">{driver.phone}</span>
                  </div>
                </div>
                <div className="info-row">
                  <Info size={16} />
                  <div>
                    <span className="label">Vehicle</span>
                    <span className="value">{driver.vehicle}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="tracking-card">
              <h3 className="card-title"><MapPin size={18} /> Stray Details</h3>
              <div className="stray-info">
                <div className="info-row">
                  <Info size={16} />
                  <div>
                    <span className="label">Type</span>
                    <span className="value">{report.type}</span>
                  </div>
                </div>
                <div className="info-row">
                  <FileText size={16} />
                  <div>
                    <span className="label">Description</span>
                    <span className="value">{report.description}</span>
                  </div>
                </div>
                {report.aiVisionData && (
                  <div style={{ marginLeft: '24px', marginRight: '8px', marginBottom: '12px' }}>
                    <AIVisionInsights aiData={report.aiVisionData} />
                  </div>
                )}
                <div className="info-row">
                  <User size={16} />
                  <div>
                    <span className="label">Reporter</span>
                    <span className="value">{report.reporter}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Map View */}
          <div className="map-wrapper">
            <MapContainer center={rescuerPos} zoom={14} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution='&copy; CARTO'
              />

              {route.length > 0 && (
                <Polyline positions={route} color="#2196F3" weight={6} dashArray="1, 10" />
              )}

              <Marker position={report.location} icon={strayIcon}>
                <Popup>Stray Animal Location</Popup>
              </Marker>
              <Marker position={hospitalPos} icon={hospitalIcon}>
                <Popup>Your Clinic</Popup>
              </Marker>
              <Marker position={rescuerPos} icon={ambulanceIcon}>
                <Popup>Driver Location</Popup>
              </Marker>

              <MapRecenter center={rescuerPos} />
            </MapContainer>
          </div>
        </div>
      </div>
    </>
  );
}

function MapRecenter({ center }) {
  const map = useMap();

  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);

  useEffect(() => {
    map.panTo(center, { animate: true, duration: 0.5 });
  }, [center, map]);

  return null;
}

export default VetTracking;

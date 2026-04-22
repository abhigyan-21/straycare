import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { User, Phone, MapPin, Ambulance, Info, ArrowLeft, FileText } from 'lucide-react';
import '../../styles/vet/VetTracking.css';

// Icons
import ambulanceImg from '../../assets/images/ambulance.png';
import hospitalImg from '../../assets/images/Hospital.png';
import pickupImg from '../../assets/images/Pickup.png';

const ambulanceIcon = new L.Icon({ iconUrl: ambulanceImg, iconSize: [60, 40], iconAnchor: [30, 20] });
const hospitalIcon = new L.Icon({ iconUrl: hospitalImg, iconSize: [50, 50], iconAnchor: [25, 50] });
const strayIcon = new L.Icon({ iconUrl: pickupImg, iconSize: [45, 45], iconAnchor: [22, 45] });

const MOCK_REPORTS = {
  'REP-7729': { id: 'REP-7729', type: 'Dog', description: 'Golden Retriever with a leg injury.', location: [30.7420, 76.8188], reporter: 'Rahul Singh', contact: '+91 91234 56789' },
  'REP-8102': { id: 'REP-8102', type: 'Cat', description: 'Stray cat trapped in a drain.', location: [30.7333, 76.7794], reporter: 'Anjali Sharma', contact: '+91 99887 76655' },
};

const HOSPITAL_POS = [30.7500, 76.8000];

function VetTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const report = MOCK_REPORTS[id] || MOCK_REPORTS['REP-7729'];

  const [rescuerPos, setRescuerPos] = useState([30.7200, 76.7600]);
  const [route, setRoute] = useState([]);
  const [eta, setEta] = useState(12);

  // Mock driver details
  const driver = {
    name: "Sunil Kumar",
    phone: "+91 88776 65544",
    vehicle: "Ambulance UP-16-AX-1234",
    status: "Heading to Stray"
  };

  useEffect(() => {
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
        }
      } catch (err) {
        console.error("Routing error:", err);
      }
    };
    fetchRoute();
  }, [report.location, rescuerPos]);

  return (
    <div className="vet-tracking-page">
      <div className="tracking-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>
        <h1>Rescue Tracking: {id}</h1>
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
            <Marker position={HOSPITAL_POS} icon={hospitalIcon}>
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
  );
}

function MapRecenter({ center }) {
  const map = useMap();
  
  useEffect(() => {
    // Fix for map tiles not loading correctly in some containers
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

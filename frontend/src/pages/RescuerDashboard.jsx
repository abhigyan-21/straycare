import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/RescuerPages.css';

const MOCK_REPORTS = [
  {
    id: 'rescue-101',
    type: 'Dog',
    description: 'Injured limb, bleeding slightly. Very friendly.',
    location: [30.7420, 76.8188], // Near Sukhna Lake
    address: 'Sukhna Lake Road, Sector 1',
    reportedBy: 'Rahul Singh',
    contact: '+91 91234 56789'
  },
  {
    id: 'rescue-102',
    type: 'Cat',
    description: 'Stuck inside a drain pipe for 2 days.',
    location: [30.7333, 76.7794], // Sector 17
    address: 'Sector 17 Market, Plaza',
    reportedBy: 'Anjali Sharma',
    contact: '+91 99887 76655'
  },
  {
    id: 'rescue-103',
    type: 'Puppy',
    description: 'High fever and shivering. Needs immediate care.',
    location: [30.7046, 76.7179], // Mohali
    address: 'Phase 7, Industrial Area',
    reportedBy: 'Vikram Mehta',
    contact: '+91 98765 12345'
  }
];

// Haversine formula to calculate distance in KM
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function RescuerDashboard() {
  const navigate = useNavigate();
  const [rescuerPos, setRescuerPos] = useState(null);
  const [sortedReports, setSortedReports] = useState(MOCK_REPORTS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setRescuerPos({ lat: latitude, lon: longitude });
          
          // Sort reports by distance
          const sorted = [...MOCK_REPORTS].sort((a, b) => {
            const distA = getDistance(latitude, longitude, a.location[0], a.location[1]);
            const distB = getDistance(latitude, longitude, b.location[0], b.location[1]);
            return distA - distB;
          });
          
          // Add distance property for display
          const withDist = sorted.map(r => ({
            ...r,
            distance: getDistance(latitude, longitude, r.location[0], r.location[1]).toFixed(1)
          }));
          
          setSortedReports(withDist);
          setIsLoading(false);
        },
        (error) => {
          console.error("Error getting location", error);
          setIsLoading(false);
        }
      );
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleAcceptRescue = (reportId) => {
    console.log("Accepting rescue for:", reportId);
    navigate(`/rescuer/nav/${reportId}`);
  };

  return (
    <div className="rescuer-page">
      <div className="rescuer-header">
        <h1>RESCUER DASHBOARD</h1>
        <div className="user-profile-badge">
            <strong>DR. AMAN SHARMA</strong>
        </div>
      </div>

      <div className="rescue-feed">
        {sortedReports.map(report => (
          <div key={report.id} className="rescue-card">
            <div className="pet-pic-placeholder">
              pet pic
            </div>
            
            <div className="rescue-details">
              <div className="detail-block">
                <strong>Report:</strong>
                <p>{report.type}: {report.description}</p>
              </div>
              <div className="detail-block">
                <strong>Location:</strong>
                <p>{report.address} ({report.distance || '?'} km away)</p>
              </div>
              <div className="detail-block">
                <strong>Reported By:</strong>
                <p>{report.reportedBy}</p>
              </div>
              <div className="detail-block">
                <strong>Contact:</strong>
                <p>{report.contact}</p>
              </div>
            </div>

            <div className="rescue-actions">
              <button 
                className="rescue-btn"
                onClick={() => handleAcceptRescue(report.id)}
              >
                I'll Rescue
              </button>
            </div>
          </div>
        ))}

        {isLoading && <div className="loader">Updating nearby rescues...</div>}
      </div>
    </div>
  );
}

export default RescuerDashboard;

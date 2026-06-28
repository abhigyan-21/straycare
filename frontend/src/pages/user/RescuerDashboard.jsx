import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import '../../styles/user/RescuerPages.css';
import ActionLoader from '../../components/ActionLoader';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../services/api';
import io from 'socket.io-client';

// Sub-component to reverse geocode lat/lng to readable address
const ReportAddress = ({ lat, lng, fallbackAddress }) => {
  const [address, setAddress] = useState(fallbackAddress || 'Fetching address...');

  useEffect(() => {
    if (fallbackAddress) {
      setAddress(fallbackAddress);
      return;
    }
    if (!lat || !lng) {
      setAddress('No location coordinates');
      return;
    }

    let active = true;
    const fetchAddress = async () => {
      try {
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
        const data = await response.json();
        if (active) {
          const formatted = `${data.locality || data.city || 'Unknown Location'}, ${data.principalSubdivision || data.countryName}`;
          setAddress(formatted);
        }
      } catch (err) {
        if (active) {
          setAddress(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
        }
      }
    };
    fetchAddress();
    return () => {
      active = false;
    };
  }, [lat, lng, fallbackAddress]);

  return <>{address}</>;
};

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

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

function RescuerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [rescuerPos, setRescuerPos] = useState(null);
  const [sortedReports, setSortedReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const socketRef = useRef();

  const fetchReportsAndLocation = useCallback(async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    const startTime = Date.now();

    let fetchedReports = [];
    try {
      const response = await apiClient.get('/reports');
      fetchedReports = response.data || [];
    } catch (err) {
      console.error("Error fetching reports", err);
    }

    // Filter reports:
    // Show reports that are status 'REPORTED', OR status 'ASSIGNED' or 'RESCUED' and assigned to current user
    const filtered = fetchedReports.filter(r =>
      r.status === 'REPORTED' ||
      ((r.status === 'ASSIGNED' || r.status === 'RESCUED') && r.assignedRescuerId === user?.id)
    );

    const finishLoading = (reportsList) => {
      setSortedReports(reportsList);
      if (showLoader) {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 1000 - elapsedTime);
        setTimeout(() => {
          setIsLoading(false);
        }, remainingTime);
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setRescuerPos({ lat: latitude, lon: longitude });

          // Auto-save location to backend so distance-based notifications work for independent rescuers
          apiClient.post('/users/rescuer-location', { lat: latitude, lng: longitude })
            .catch(err => console.error('Failed to update rescuer location on server', err));

          // Sort by distance
          const sorted = [...filtered].sort((a, b) => {
            const latA = a.locationLat !== undefined ? a.locationLat : (a.location?.[0] || 0);
            const lonA = a.locationLng !== undefined ? a.locationLng : (a.location?.[1] || 0);
            const latB = b.locationLat !== undefined ? b.locationLat : (b.location?.[0] || 0);
            const lonB = b.locationLng !== undefined ? b.locationLng : (b.location?.[1] || 0);

            const distA = getDistance(latitude, longitude, latA, lonA);
            const distB = getDistance(latitude, longitude, latB, lonB);
            return distA - distB;
          });

          // Map distance property for display
          const withDist = sorted.map(r => {
            const rLat = r.locationLat !== undefined ? r.locationLat : (r.location?.[0] || 0);
            const rLon = r.locationLng !== undefined ? r.locationLng : (r.location?.[1] || 0);
            return {
              ...r,
              distance: getDistance(latitude, longitude, rLat, rLon).toFixed(1)
            };
          });

          finishLoading(withDist);
        },
        (error) => {
          console.error("Error getting location", error);
          // Default mapping without distance if location fails
          const withoutDist = filtered.map(r => ({
            ...r,
            distance: null
          }));
          finishLoading(withoutDist);
        }
      );
    } else {
      const withoutDist = filtered.map(r => ({
        ...r,
        distance: null
      }));
      finishLoading(withoutDist);
    }
  }, [user?.id]);

  // Initial fetch on mount
  useEffect(() => {
    fetchReportsAndLocation(true);
  }, [fetchReportsAndLocation]);

  // WebSocket real-time updates listener
  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('new-report', (newReport) => {
      console.log('Real-time: new report created. Refreshing rescues list...', newReport);
      fetchReportsAndLocation(false);
    });

    socketRef.current.on('report-updated', (updatedReport) => {
      console.log('Real-time: report updated. Refreshing rescues list...', updatedReport);
      fetchReportsAndLocation(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [fetchReportsAndLocation]);

  const handleAcceptRescue = async (reportId, isAlreadyAssigned) => {
    if (isAlreadyAssigned) {
      navigate(`/rescuer/nav/${reportId}`);
      return;
    }

    try {
      // Call self-assign backend endpoint
      await apiClient.patch(`/reports/${reportId}/assign`, { rescuerId: user?.id });
      navigate(`/rescuer/nav/${reportId}`);
    } catch (err) {
      console.error("Error accepting rescue:", err);
      alert("Failed to accept rescue. It may have been taken by another rescuer.");
    }
  };

  return (
    <>
      <Helmet>
        <title>Furzo - Rescuer Dashboard</title>
        <meta name="description" content="View and accept nearby animal rescue requests. Coordinate rescues efficiently as a registered Furzo rescuer." />
      </Helmet>
      <div className="rescuer-page">
        <div className="rescuer-header">
          <h1>RESCUER DASHBOARD</h1>
        </div>

        <div className="rescue-feed">
          {isLoading ? (
            <ActionLoader message="Locating nearby rescues..." />
          ) : sortedReports.length === 0 ? (
            <div className="no-rescues-message">
              <p>No active rescues available at the moment.</p>
            </div>
          ) : (
            sortedReports.map(report => (
              <div key={report.id} className="rescue-card">
                <div className="pet-pic-placeholder">
                  {report.mediaUrls && report.mediaUrls[0] ? (
                    <img src={report.mediaUrls[0]} alt="pet preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                  ) : (
                    'pet pic'
                  )}
                </div>

                <div className="rescue-details">
                  <div className="detail-block">
                    <strong>Report:</strong>
                    <p>{report.type ? `${report.type}: ` : ''}{report.description}</p>
                  </div>
                  <div className="detail-block">
                    <strong>Location:</strong>
                    <p>
                      <ReportAddress
                        lat={report.locationLat !== undefined ? report.locationLat : report.location?.[0]}
                        lng={report.locationLng !== undefined ? report.locationLng : report.location?.[1]}
                        fallbackAddress={report.address}
                      />
                      {' '}({report.distance ? `${report.distance} km away` : 'distance unknown'})
                    </p>
                  </div>
                  <div className="detail-block">
                    <strong>Reported By:</strong>
                    <p>{report.reporter?.name || report.reportedBy || 'Anonymous'}</p>
                  </div>
                  <div className="detail-block">
                    <strong>Contact:</strong>
                    <p>{report.reporter?.phone || report.contact || 'N/A'}</p>
                  </div>
                </div>

                <div className="rescue-actions">
                  <button
                    className="rescue-btn"
                    onClick={() => handleAcceptRescue(report.id, report.assignedRescuerId === user?.id)}
                  >
                    {report.assignedRescuerId === user?.id
                      ? (report.status === 'RESCUED' ? 'Resume Rescue' : 'Track Rescue')
                      : "I'll Rescue"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default RescuerDashboard;

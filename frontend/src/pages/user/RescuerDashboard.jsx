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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
        console.warn(err);
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

// How often to poll as a fallback (ms). Socket handles instant updates;
// polling catches anything missed due to disconnects or missed events.
const POLL_INTERVAL_MS = 15000;

function RescuerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [rescuerPos, setRescuerPos] = useState(null);
  const rescuerPosRef = useRef(null); // stable ref so callbacks always have latest coords
  const [sortedReports, setSortedReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const socketRef = useRef();
  const pollTimerRef = useRef();

  // Build the sorted/filtered list from raw reports + current position
  const applyPositionAndSet = useCallback((fetchedReports, pos) => {
    const filtered = fetchedReports.filter(r => {
      if (r.status === 'REPORTED') return true;
      if (r.status === 'ASSIGNED' && r.assignedRescuerId === user?.id) return true;
      // RESCUED + active phase means still in transit — show to rescuer
      if (r.status === 'RESCUED' && r.rescuePhase && r.assignedRescuerId === user?.id) return true;
      // RESCUED + no phase means handed off to vet — rescuer is done, hide it
      return false;
    });

    if (pos) {
      const sorted = [...filtered].sort((a, b) => {
        const distA = getDistance(pos.lat, pos.lon,
          a.locationLat ?? a.location?.[0] ?? 0,
          a.locationLng ?? a.location?.[1] ?? 0);
        const distB = getDistance(pos.lat, pos.lon,
          b.locationLat ?? b.location?.[0] ?? 0,
          b.locationLng ?? b.location?.[1] ?? 0);
        return distA - distB;
      });

      setSortedReports(sorted.map(r => ({
        ...r,
        distance: getDistance(
          pos.lat, pos.lon,
          r.locationLat ?? r.location?.[0] ?? 0,
          r.locationLng ?? r.location?.[1] ?? 0
        ).toFixed(1)
      })));
    } else {
      setSortedReports(filtered.map(r => ({ ...r, distance: null })));
    }
  }, [user?.id]);

  const fetchReports = useCallback(async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    const startTime = Date.now();

    try {
      const response = await apiClient.get('/reports');
      const fetchedReports = response.data || [];
      applyPositionAndSet(fetchedReports, rescuerPosRef.current);
    } catch (err) {
      console.error('Error fetching reports', err);
    } finally {
      if (showLoader) {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 1000 - elapsed);
        setTimeout(() => setIsLoading(false), remaining);
      }
    }
  }, [applyPositionAndSet]);

  // Get geolocation once on mount, then kick off data fetch
  useEffect(() => {
    const initLocation = () => {
      if (!('geolocation' in navigator)) {
        fetchReports(true);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = { lat: position.coords.latitude, lon: position.coords.longitude };
          setRescuerPos(pos);
          rescuerPosRef.current = pos;

          // Save to backend for push notification radius checks
          apiClient.post('/users/rescuer-location', { lat: pos.lat, lng: pos.lon })
            .catch(err => console.error('Failed to update rescuer location on server', err));

          // Register location with socket server so targeted broadcasts work.
          // If socket connected before geolocation resolved, this catches up.
          if (socketRef.current?.connected && socketRef.current._registerWithServer) {
            socketRef.current._registerWithServer();
          }

          fetchReports(true);
        },
        (error) => {
          console.error('Error getting location', error);
          fetchReports(true);
        }
      );
    };

    initLocation();
  }, [fetchReports]);

  // Socket: real-time instant updates targeted to nearby rescuers
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    const registerWithServer = () => {
      // Tell the server our position so it can target us in proximity-based broadcasts.
      // Use the ref so we always send the latest coords even if state hasn't flushed yet.
      const pos = rescuerPosRef.current;
      if (pos && user?.id) {
        socketRef.current.emit('rescuer-register', {
          userId: user.id,
          lat: pos.lat,
          lng: pos.lon,
        });
      }
    };

    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current.id);
      registerWithServer();
    });

    socketRef.current.on('disconnect', (reason) => {
      console.warn('Socket disconnected:', reason);
    });

    socketRef.current.on('new-report', () => {
      fetchReports(false);
    });

    socketRef.current.on('report-updated', () => {
      fetchReports(false);
    });

    // If location resolves after the socket connects, register then too
    socketRef.current._registerWithServer = registerWithServer;

    return () => {
      socketRef.current?.disconnect();
    };
  }, [fetchReports, user?.id]);

  // Polling fallback: re-fetch every POLL_INTERVAL_MS in case socket misses an event
  useEffect(() => {
    pollTimerRef.current = setInterval(() => {
      fetchReports(false);
    }, POLL_INTERVAL_MS);

    return () => {
      clearInterval(pollTimerRef.current);
    };
  }, [fetchReports]);

  const handleAcceptRescue = async (reportId, isAlreadyAssigned) => {
    if (isAlreadyAssigned) {
      navigate(`/rescuer/nav/${reportId}`);
      return;
    }

    try {
      await apiClient.patch(`/reports/${reportId}/assign`, { rescuerId: user?.id });
      navigate(`/rescuer/nav/${reportId}`);
    } catch (err) {
      console.error('Error accepting rescue:', err);
      alert('Failed to accept rescue. It may have been taken by another rescuer.');
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

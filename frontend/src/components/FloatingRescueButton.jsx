import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRescueStore } from '../store/rescueStore';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';
import apiClient from '../services/api';
import '../styles/FloatingRescueButton.css';
import ambulanceImg from '../assets/images/ambulance.webp';

const fetchEtaFromOsrm = async (fromLat, fromLng, toLat, toLng) => {
    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes && data.routes[0]) {
            return Math.max(1, Math.ceil(data.routes[0].duration / 60));
        }
    } catch { /* silent fail */ }
    return null;
};

const FloatingRescueButton = () => {
    const { activeRescue, startRescue, endRescue, updateRescueEta } = useRescueStore();
    const { user, isLoggedIn } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!isLoggedIn || !user) {
            if (activeRescue?.isActive) {
                endRescue();
            }
            return;
        }

        const controller = new AbortController();

        const syncActiveRescue = async () => {
            try {
                if (user.role === 'RESCUER' || user.role === 'ADMIN') {
                    const response = await apiClient.get('/reports', { signal: controller.signal });
                    const active = response.data?.find(r =>
                        r.assignedRescuerId === user.id &&
                        (r.status === 'ASSIGNED' ||
                         (r.status === 'RESCUED' && r.rescuePhase)) // RESCUED+no phase = handed off, hide button
                    );
                    if (active) {
                        const current = useRescueStore.getState().activeRescue;
                        if (!current?.isActive || current.reportId !== active.id) {
                            startRescue(active.id, 'rescuer', null);
                        }
                        // Compute ETA: rescuer's live position → report location
                        if (active.rescuerLat && active.rescuerLng && active.locationLat && active.locationLng) {
                            const eta = await fetchEtaFromOsrm(
                                active.rescuerLat, active.rescuerLng,
                                active.locationLat, active.locationLng
                            );
                            if (eta) updateRescueEta(eta);
                        }
                    } else if (useRescueStore.getState().activeRescue?.isActive) {
                        endRescue();
                    }
                } else {
                    const response = await apiClient.get('/reports/my-reports', { signal: controller.signal });
                    const active = response.data?.find(r =>
                        r.status === 'ASSIGNED' || r.status === 'RESCUED'
                    );
                    if (active) {
                        const current = useRescueStore.getState().activeRescue;
                        if (!current?.isActive || current.reportId !== active.id) {
                            startRescue(active.id, 'user', null);
                        }
                        // Compute ETA: rescuer's live position → user's report location
                        if (active.rescuerLat && active.rescuerLng && active.locationLat && active.locationLng) {
                            const eta = await fetchEtaFromOsrm(
                                active.rescuerLat, active.rescuerLng,
                                active.locationLat, active.locationLng
                            );
                            if (eta) updateRescueEta(eta);
                        }
                    } else if (useRescueStore.getState().activeRescue?.isActive) {
                        endRescue();
                    }
                }
            } catch (err) {
                if (axios.isCancel(err) || err.code === 'ERR_CANCELED') return;
                console.error("Failed to sync active rescue with DB:", err);
            }
        };

        syncActiveRescue();
        const intervalId = setInterval(syncActiveRescue, 15000); // sync every 15s

        return () => {
            clearInterval(intervalId);
            controller.abort();
        };
    }, [isLoggedIn, user, startRescue, endRescue, updateRescueEta, activeRescue?.isActive]);

    // Don't show if no active rescue
    if (!activeRescue || !activeRescue.isActive) return null;

    // Don't show if already on the map page
    const mapPaths = ['/live-track', '/rescuer/nav', '/track'];
    const isOnMapPage = mapPaths.some(path => location.pathname.startsWith(path));

    if (isOnMapPage) return null;

    const handleClick = () => {
        const targetPath = activeRescue.mode === 'user'
            ? `/live-track/${activeRescue.reportId}`
            : `/rescuer/nav/${activeRescue.reportId}`;

        navigate(targetPath);
    };

    return (
        <div className="rescue-floating-container" onClick={handleClick}>
            <div className="rescue-pill">
                <div className="rescue-text-section">
                    <span className="rescue-eta">{activeRescue.eta ? `${activeRescue.eta} mins` : '...'} away</span>
                    <span className="rescue-destination">from destination</span>
                </div>
                <div className="rescue-icon-circle pulsing">
                    <div className="white-inner-circle">
                        <img src={ambulanceImg} alt="Ambulance" className="ambulance-icon-small" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FloatingRescueButton;

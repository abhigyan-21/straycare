import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRescueStore } from '../store/rescueStore';
import { useAuthStore } from '../store/authStore';
import apiClient from '../services/api';
import '../styles/FloatingRescueButton.css';
import ambulanceImg from '../assets/images/ambulance.png';

const FloatingRescueButton = () => {
    const { activeRescue, startRescue, endRescue } = useRescueStore();
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

        const syncActiveRescue = async () => {
            try {
                if (user.role === 'RESCUER' || user.role === 'ADMIN') {
                    // Fetch all reports to find active assigned rescues
                    const response = await apiClient.get('/reports');
                    const active = response.data?.find(r => 
                        r.assignedRescuerId === user.id && 
                        (r.status === 'ASSIGNED' || r.status === 'RESCUED')
                    );
                    if (active) {
                        startRescue(active.id, 'rescuer', 8);
                    } else if (activeRescue?.mode === 'rescuer') {
                        endRescue();
                    }
                } else {
                    // Fetch user's own reports to check if active
                    const response = await apiClient.get('/reports/my-reports');
                    const active = response.data?.find(r => 
                        r.status === 'ASSIGNED' || r.status === 'RESCUED'
                    );
                    if (active) {
                        startRescue(active.id, 'user', 10);
                    } else if (activeRescue?.mode === 'user') {
                        endRescue();
                    }
                }
            } catch (err) {
                console.error("Failed to sync active rescue with DB:", err);
            }
        };

        syncActiveRescue();
        const intervalId = setInterval(syncActiveRescue, 10000); // sync every 10 seconds

        return () => clearInterval(intervalId);
    }, [isLoggedIn, user?.id, user?.role, startRescue, endRescue]);

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
                    <span className="rescue-eta">{activeRescue.eta || '5'} mins away</span>
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

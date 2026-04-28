import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRescueStore } from '../store/rescueStore';
import '../styles/FloatingRescueButton.css';
import ambulanceImg from '../assets/images/ambulance.png';

const FloatingRescueButton = () => {
    const { activeRescue } = useRescueStore();
    const navigate = useNavigate();
    const location = useLocation();

    // Don't show if no active rescue
    if (!activeRescue || !activeRescue.isActive) return null;

    // Don't show if already on the map page
    // Using a more comprehensive list of map paths
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
                    <span className="rescue-eta">{activeRescue.eta || '5'}mins away</span>
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

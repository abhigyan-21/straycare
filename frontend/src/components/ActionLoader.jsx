import React from 'react';
import '../styles/ActionLoader.css';

const ActionLoader = ({ message = "Loading..." }) => {
    return (
        <div className="action-loader-container">
            <div className="action-loader-spinner"></div>
            <p className="action-loader-message">{message}</p>
        </div>
    );
};

export default ActionLoader;

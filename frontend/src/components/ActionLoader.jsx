import React, { useState, useEffect } from 'react';
import '../styles/ActionLoader.css';

import dogRun1 from '../assets/loader/dog_run1.png';
import dogRun2 from '../assets/loader/dog_run2.png';
import catRun1 from '../assets/loader/cat_run1.png';
import catRun2 from '../assets/loader/cat_run2.png';

const ActionLoader = ({ message = "Loading..." }) => {
    const images = [dogRun1, dogRun2, catRun1, catRun2];
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 150);
        return () => clearInterval(interval);
    }, [images.length]);

    return (
        <div className="action-loader-container">
            <div className="action-loader-image-container">
                <img 
                    src={images[currentIndex]} 
                    alt="Loading..." 
                    className="action-loader-image"
                />
            </div>
            <p className="action-loader-message">{message}</p>
        </div>
    );
};

export default ActionLoader;

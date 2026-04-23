import React, { useState, useEffect } from 'react';
import '../styles/Loader.css';

// Import images
import dogRun1 from '../assets/loader/dog_run1.png';
import dogRun2 from '../assets/loader/dog_run2.png';
import catRun1 from '../assets/loader/cat_run1.png';
import catRun2 from '../assets/loader/cat_run2.png';

const tips = [
        "Tip: Let them come to you first!",
        "Tip: Start with gentle head pats.",
        "Tip: Watch their tail—it tells a lot!",
        "Tip: Slow hands, happy pets.",
        "Tip: If they pull away, give them space.",
    ];

const Loader = () => {
    const images = [dogRun1, dogRun2, catRun1, catRun2];
    const [currentIndex, setCurrentIndex] = useState(0);

    const [currentTips, setCurrentTips] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 150); // Change rapidly every 150ms to simulate running

        return () => clearInterval(interval);
    }, [images.length]);

    useEffect(() => {
        const tipchange = setInterval(() => {
            setCurrentTips((prevIndex) => (prevIndex + 1) % tips.length);
        }, 1000);

        return () => clearInterval(tipchange);
    }, [])

    return (
        <div className="loader-overlay">
            <div className="loader-title"> StrayCare</div>
            <div className="loader-content">

                <div className="loader-image-container">
                    <img
                        src={images[currentIndex]}
                        alt="Loading..."
                        className="loader-image"
                    />
                </div>

                <div className="loader-text">
                    <span>L</span>
                    <span>o</span>
                    <span>a</span>
                    <span>d</span>
                    <span>i</span>
                    <span>n</span>
                    <span>g</span>
                    <span className="dot">.</span>
                    <span className="dot">.</span>
                    <span className="dot">.</span>
                </div>

                <div className="loader-tip">
                    {tips[currentTips]}
                </div>
            </div>
        </div>
    );
};

export default Loader;

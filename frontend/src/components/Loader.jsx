import React, { useState, useEffect } from 'react';
import '../styles/Loader.css';

// Import images (WebP for faster loading)
import dogRun1 from '../assets/loader/dog_run1.webp';
import dogRun2 from '../assets/loader/dog_run2.webp';
import catRun1 from '../assets/loader/cat_run1.webp';
import catRun2 from '../assets/loader/cat_run2.webp';

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
            <div className="loader-title">
                <span>F</span>
                <span>U</span>
                <span>R</span>
                <span>Z</span>
                <span className="loader-logo-o">
                    <svg viewBox="0 0 100 100" className="loader-paw-svg">
                        <circle cx="50" cy="50" r="46" fill="currentColor" />
                        <path d="M50 54c-8 0-14.5 5.5-14.5 11 0 4.5 6.5 8.5 14.5 8.5s14.5-4 14.5-8.5c0-5.5-6.5-11-14.5-11z" fill="#fff" />
                        <ellipse cx="40" cy="42" rx="5" ry="7" transform="rotate(-15 40 42)" fill="#fff" />
                        <ellipse cx="60" cy="42" rx="5" ry="7" transform="rotate(15 60 42)" fill="#fff" />
                        <ellipse cx="28" cy="50" rx="4.5" ry="6.5" transform="rotate(-35 28 50)" fill="#fff" />
                        <ellipse cx="72" cy="50" rx="4.5" ry="6.5" transform="rotate(35 72 50)" fill="#fff" />
                    </svg>
                </span>
            </div>
            <div className="loader-content">

                <div className="loader-image-container">
                    <img
                        src={images[currentIndex]}
                        className="loader-image"
                        loading='eager'
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

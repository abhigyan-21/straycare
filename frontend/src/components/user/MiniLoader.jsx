import React, { useState, useEffect } from 'react';
import dogRun1 from '../../assets/loader/dog_run1.webp';
import dogRun2 from '../../assets/loader/dog_run2.webp';
import catRun1 from '../../assets/loader/cat_run1.webp';
import catRun2 from '../../assets/loader/cat_run2.webp';

const MiniLoader = () => {
    const images = [dogRun1, dogRun2, catRun1, catRun2];
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 150);
        return () => clearInterval(interval);
    }, [images.length]);

    return (
        <img
            src={images[currentIndex]}
            alt="Loading..."
            className="mini-loader-img"
        />
    );
};

export default MiniLoader;

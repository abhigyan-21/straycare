import React, { useEffect, useRef } from 'react';
import '../../styles/user/StoriesSection.css';
import { storiesData } from '../../data/storiesData';

const StoriesSection = () => {
    const sectionRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                window.dispatchEvent(new Event('preload-partners'));
                observer.disconnect();
            }
        });

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <section className="stories-section" ref={sectionRef}>
            <div className="stories-header">
                <h2>Our Journey & Impact</h2>
                <p>Every small contribution writes a big story of survival and hope.</p>
            </div>
            <div className="stories-grid">
                {storiesData.map((story) => (
                    <div key={story.id} className="story-card">
                        <div className="story-image-container">
                            <img src={story.image} alt={story.title} className="story-image" />
                            <span className="story-category">{story.category}</span>
                        </div>
                        <div className="story-content">
                            <span className="story-date">{story.date}</span>
                            <h3>{story.title}</h3>
                            <p>{story.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default StoriesSection;

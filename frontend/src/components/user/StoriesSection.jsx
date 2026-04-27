import React, { useEffect, useState } from 'react';
import '../../styles/user/StoriesSection.css';
import { getStories } from '../../services/api';

const StoriesSection = () => {
    const [stories, setStories] = useState([]);

    useEffect(() => {
        const fetchStories = async () => {
            const data = await getStories();
            setStories(data);
        };
        fetchStories();
    }, []);

    return (
        <section className="stories-section">
            <div className="stories-header">
                <h2>Our Journey & Impact</h2>
                <p>Every small contribution writes a big story of survival and hope.</p>
            </div>
            <div className="stories-grid">
                {stories.map((story) => (
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

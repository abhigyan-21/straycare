import React from 'react';
import '../styles/About.css';

function About() {
    return (
        <div className="about-container">
            <div className="about-content-wrapper">
                <div className="about-card">
                    <h1>About Us</h1>

                    <div className="about-section">
                        <h2>How We Started</h2>
                        <p>
                            StrayCare began with a simple observation: countless stray animals on our streets needing food, shelter, and medical attention. A small group of passionate volunteers decided to take action, starting by feeding a few local dogs and cats. As our community grew, so did our mission. Today, we are a dedicated organization working tirelessly to improve the lives of stray animals through rescue, rehabilitation, and finding them loving forever homes.
                        </p>
                    </div>

                    <div className="about-section">
                        <h2>Our Vision</h2>
                        <p>
                            We envision a world where every stray animal is treated with compassion and respect. Our goal is to eradicate animal homelessness and cruelty by promoting adoption, providing emergency medical care, and educating the public on responsible pet ownership. We believe that every life matters and no animal should have to suffer on the streets.
                        </p>
                    </div>

                    <div className="about-section">
                        <h2>What We Do</h2>
                        <p>
                            Through our platform, you can adopt an animal in need, report emergencies, and track strays in your locality. Together, we can make a difference in their lives, one paw at a time.
                        </p>
                    </div>
                </div>

                {/* Floating circles */}
                <div className="about-circle circle-1">
                    <img src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400&h=400" alt="Stray Dog" />
                </div>
                <div className="about-circle circle-2">
                    <img src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=400&h=400" alt="Stray Cat" />
                </div>
                <div className="about-circle circle-3">
                    <img src="https://images.unsplash.com/photo-1534361960057-19889db9621e?auto=format&fit=crop&q=80&w=400&h=400" alt="Rescued Dog" />
                </div>
                <div className="about-circle circle-4">
                    <img src="https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&q=80&w=400&h=400" alt="Rescued Cat" />
                </div>
            </div>
        </div>
    );
}

export default About;
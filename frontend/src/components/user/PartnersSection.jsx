import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import '../../styles/user/PartnersSection.css';

const PartnersSection = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const response = await api.get('/partners');
        if (Array.isArray(response.data)) {
          setPartners(response.data);
        } else {
          console.warn('Expected array of partners, got:', response.data);
          setPartners([]);
        }
      } catch (error) {
        console.error('Failed to fetch partners:', error);
      } finally {
        setLoading(false);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasFetched) {
          setHasFetched(true);
          fetchPartners();
        }
      },
      { rootMargin: '100px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    const handlePreload = () => {
      if (!hasFetched) {
        setHasFetched(true);
        fetchPartners();
      }
    };
    window.addEventListener('preload-partners', handlePreload);

    return () => {
      observer.disconnect();
      window.removeEventListener('preload-partners', handlePreload);
    };
  }, [hasFetched]);

  if (loading) {
    return (
      <section className="partners-section" ref={sectionRef}>
        <div className="partners-header">
          <h2>Our Trusted Partners</h2>
          <p>{hasFetched ? "Loading partners..." : "Working together with incredible organizations to make a difference in the lives of stray animals."}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="partners-section" ref={sectionRef}>
      <div className="partners-header">
        <h2>Our Trusted Partners</h2>
        <p>Working together with incredible organizations to make a difference in the lives of stray animals.</p>
      </div>
      <div className="partners-grid">
        {partners.slice(0, 6).map((partner) => (
          <div className="partner-card" key={partner.id}>
            <span className={`partner-badge ${partner.type.toLowerCase()}`}>
              {partner.type}
            </span>
            <div className="partner-logo-container">
              <img src={partner.logo} alt={`${partner.name} Logo`} className="partner-logo" />
            </div>
            <div className="partner-info">
              <h3>{partner.name}</h3>
              <p className="partner-location">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                {partner.location}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="view-all-partners-container">
        <Link to="/partners" className="view-all-partners-btn">View All Partners</Link>
      </div>
    </section>
  );
};

export default PartnersSection;

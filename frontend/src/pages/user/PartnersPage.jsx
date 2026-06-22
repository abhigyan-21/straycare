import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import '../../styles/user/PartnersPage.css';
import '../../styles/user/PartnersSection.css';

const PartnersPage = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

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
    fetchPartners();
  }, []);

  return (
    <div className="partners-page">
      <div className="partners-page-header">
        <h1>Our Partners</h1>
        <p>Meet the incredible organizations working with us to create a better future for stray animals.</p>
      </div>
      <div className="partners-page-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#718096' }}>
            <p>Loading partners...</p>
          </div>
        ) : (
          <div className="partners-grid">
            {partners.map((partner) => (
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
        )}
      </div>
    </div>
  );
};

export default PartnersPage;

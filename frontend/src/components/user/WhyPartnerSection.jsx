import React from 'react';
import '../../styles/user/WhyPartnerSection.css';

const benefits = [
  {
    id: 1,
    title: "Expanded Reach",
    description: "Connect with a wider community of animal lovers, volunteers, and potential adopters through our platform.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"></path>
        <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"></path>
        <circle cx="12" cy="12" r="2"></circle>
        <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"></path>
        <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"></path>
      </svg>
    )
  },
  {
    id: 2,
    title: "Greater Impact",
    description: "Together, we can rescue more strays, provide better medical care, and save more lives.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
    )
  },
  {
    id: 3,
    title: "Volunteer & Support Network",
    description: "Gain access to a community of passionate volunteers and supporters ready to contribute to rescue, adoption, and welfare initiatives.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    )
  },
  {
    id: 4,
    title: "Technology & Digital Tools",
    description: "Leverage a modern platform for adoptions, fundraising, rescue coordination, and community engagement—all in one place.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
        <line x1="8" y1="21" x2="16" y2="21"></line>
        <line x1="12" y1="17" x2="12" y2="21"></line>
      </svg>
    )
  }
];

const WhyPartnerSection = () => {
  return (
    <section className="why-partner-section">
      <div className="why-partner-header">
        <h2>Why Partner With Us?</h2>
        <p>Join our mission and help create a better future for stray animals through technology, collaboration, and greater visibility.</p>
      </div>
      <div className="why-partner-grid">
        {benefits.map((benefit) => (
          <div className="benefit-card" key={benefit.id}>
            <div className="benefit-icon">
              {benefit.icon}
            </div>
            <h3>{benefit.title}</h3>
            <p>{benefit.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhyPartnerSection;

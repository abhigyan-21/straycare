import React, { useState, useEffect, useRef } from 'react';
import '../styles/privacy_terms.css';

const SECTIONS = [
  { id: 'acceptance', label: '1. Acceptance of Terms' },
  { id: 'services', label: '2. Description of Services' },
  { id: 'accounts', label: '3. User Accounts & Registration' },
  { id: 'conduct', label: '4. Acceptable Use' },
  { id: 'content', label: '5. User Content' },
  { id: 'disclaimer', label: '6. AI Assistant Disclaimer' },
  { id: 'partners', label: '7. Veterinarians & NGOs' },
  { id: 'ip', label: '8. Intellectual Property' },
  { id: 'privacy', label: '9. Privacy' },
  { id: 'liability', label: '10. Limitation of Liability' },
  { id: 'indemnity', label: '11. Indemnification' },
  { id: 'governing-law', label: '12. Governing Law' },
  { id: 'changes', label: '13. Changes to Terms' },
  { id: 'contact', label: '14. Contact Us' },
];

function Terms() {
  const [activeSection, setActiveSection] = useState('acceptance');
  const observerRef = useRef(null);

  useEffect(() => {
    const handleIntersect = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    observerRef.current = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
    });

    SECTIONS.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        observerRef.current.observe(element);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  return (
    <div className="policy-container">
      <aside className="policy-sidebar">
        <h3>Terms of Service</h3>
        <ul className="policy-sidebar-list">
          {SECTIONS.map((section) => (
            <li
              key={section.id}
              className={`policy-sidebar-item ${activeSection === section.id ? 'active' : ''}`}
            >
              <button onClick={() => scrollToSection(section.id)}>
                {section.label}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <main className="policy-content">
        <div className="policy-header">
          <h1>Terms of Service</h1>
          <p className="policy-last-updated">Last Updated: June 4, 2026</p>
        </div>

        <section id="acceptance" className="policy-section">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing, registering on, or using the Furzo platform (the "Platform"), including its
            mobile application, web application, and all related services (collectively, "Services"),
            you agree to be legally bound by these Terms of Service ("Terms"). If you do not agree to these
            Terms, you must not use the Platform.
          </p>
          <p>
            These Terms constitute a legally binding agreement between you ("User", "you", or "your") and
            Furzo ("we", "us", or "our"). By using the Platform, you confirm that you are at least 18 years
            of age, or have obtained parental or guardian consent if you are a minor.
          </p>
        </section>

        <section id="services" className="policy-section">
          <h2>2. Description of Services</h2>
          <p>
            Furzo is a comprehensive animal welfare platform designed to connect citizens, veterinarians,
            clinics, NGOs, shelters, and pet lovers across India. The Platform provides the following services:
          </p>
          <ul>
            <li>
              <strong>Stray Animal Reporting</strong> — Users may submit reports of injured, sick, or distressed stray animals, including location data, descriptions, and photographs.
            </li>
            <li>
              <strong>Real-Time Case Tracking</strong> — Users may monitor the status of reported animals through the rescue, treatment, and rehabilitation process.
            </li>
            <li>
              <strong>Adoption & Rehoming</strong> — Shelters, NGOs, and individuals may create and browse animal adoption listings.
            </li>
            <li>
              <strong>Community & Social Features</strong> — Users may share animal welfare content, rescue stories, and pet-related updates within the Platform community.
            </li>
            <li>
              <strong>AI-Powered Pet Care Assistant</strong> — An AI guide provides general pet care information. This does not constitute professional veterinary advice.
            </li>
            <li>
              <strong>Veterinary Portal</strong> — A dedicated portal for registered veterinarians and clinics to manage rescue requests, appointments, and communications.
            </li>
            <li>
              <strong>NGO & Shelter Management</strong> — Tools for animal welfare organizations to manage rescues, volunteers, and adoption records.
            </li>
          </ul>
          <p>
            We reserve the right to modify, suspend, or discontinue any feature or Service at any time with reasonable notice.
          </p>
        </section>

        <section id="accounts" className="policy-section">
          <h2>3. User Accounts and Registration</h2>
          
          <h3>3.1 Account Creation</h3>
          <p>
            To access core features of the Platform, you must create an account by providing accurate,
            complete, and current information including your name, email address, and phone number. You are
            responsible for maintaining the confidentiality of your login credentials.
          </p>

          <h3>3.2 Account Types</h3>
          <ul>
            <li><strong>General User</strong> — Citizens reporting stray animals, adopters, and community members.</li>
            <li><strong>Veterinary Professional</strong> — Licensed veterinarians and registered clinics with verified credentials.</li>
            <li><strong>NGO / Shelter Organization</strong> — Registered animal welfare organizations.</li>
          </ul>

          <h3>3.3 Account Responsibility</h3>
          <p>
            You are solely responsible for all activities that occur under your account. You must notify us
            immediately at <a href="mailto:support@furzo.in">support@furzo.in</a> of any unauthorized use or
            security breach. We are not liable for any loss resulting from unauthorized use of your account.
          </p>

          <h3>3.4 Account Termination</h3>
          <p>
            We reserve the right to suspend or permanently terminate accounts that violate these Terms,
            engage in fraudulent activity, or are otherwise used in a manner harmful to users, animals,
            or the Platform.
          </p>
        </section>

        <section id="conduct" className="policy-section">
          <h2>4. Acceptable Use and Prohibited Conduct</h2>
          
          <h3>4.1 Acceptable Use</h3>
          <p>
            You agree to use the Platform only for lawful purposes related to animal welfare, rescue, adoption,
            and veterinary services in good faith.
          </p>

          <h3>4.2 Prohibited Conduct</h3>
          <p>You must not:</p>
          <ul>
            <li>Submit false, misleading, or fabricated animal reports.</li>
            <li>Upload content that is defamatory, obscene, abusive, or otherwise unlawful.</li>
            <li>Impersonate any person, veterinarian, NGO, or organization.</li>
            <li>Use the Platform to facilitate animal cruelty, illegal trade, or any activity that harms animals.</li>
            <li>Attempt to gain unauthorized access to any part of the Platform or other users' accounts.</li>
            <li>Use automated bots, scrapers, or scripts to access the Platform without express written permission.</li>
            <li>Upload viruses, malware, or any code intended to disrupt or damage the Platform.</li>
            <li>Use the AI Pet Care Assistant as a substitute for professional veterinary diagnosis or treatment.</li>
            <li>Violate any applicable Indian law, including the Prevention of Cruelty to Animals Act, 1960.</li>
          </ul>
        </section>

        <section id="content" className="policy-section">
          <h2>5. User-Generated Content</h2>
          
          <h3>5.1 Your Content</h3>
          <p>
            You retain ownership of content you submit, including photographs, rescue reports, and social posts
            ("User Content"). By submitting User Content, you grant Furzo a non-exclusive, royalty-free,
            worldwide licence to use, display, reproduce, and distribute such content for the purpose of
            operating and promoting the Platform.
          </p>

          <h3>5.2 Content Standards</h3>
          <p>
            All User Content must be accurate, relevant to animal welfare, and compliant with applicable laws.
            You must not submit content that infringes third-party intellectual property rights or violates any
            individual's privacy.
          </p>

          <h3>5.3 Content Moderation</h3>
          <p>
            We reserve the right to review, remove, or restrict any User Content that violates these Terms or our
            Community Guidelines, without prior notice.
          </p>
        </section>

        <section id="disclaimer" className="policy-section">
          <h2>6. AI Pet Care Assistant — Disclaimer</h2>
          <div className="policy-highlight-box">
            <p>
              <strong>Professional Advice Disclaimer:</strong> The AI-Powered Pet Care Assistant provides general
              informational guidance only. It is not a substitute for professional veterinary advice, diagnosis, or
              treatment. Always consult a qualified veterinarian for specific health concerns regarding any animal.
              Furzo expressly disclaims all liability for any actions taken or not taken based on information
              provided by the AI assistant.
            </p>
          </div>
        </section>

        <section id="partners" className="policy-section">
          <h2>7. Veterinary Professionals and NGO Partners</h2>
          <p>
            Veterinary professionals and NGOs accessing dedicated portal features represent that they hold all
            required registrations, licences, and authorizations under applicable Indian law (including the Indian
            Veterinary Council Act, 1984, and applicable NGO registration requirements). Furzo does not independently
            verify professional credentials and is not liable for the conduct of registered professionals or organizations
            on the Platform.
          </p>
        </section>

        <section id="ip" className="policy-section">
          <h2>8. Intellectual Property</h2>
          <p>
            All content, features, trademarks, logos, software, and technology comprising the Platform (excluding
            User Content) are owned by or licenced to Furzo and are protected under applicable Indian and
            international intellectual property laws. You may not copy, reproduce, distribute, or create derivative
            works from any part of the Platform without express written consent.
          </p>
        </section>

        <section id="privacy" className="policy-section">
          <h2>9. Privacy</h2>
          <p>
            Your use of the Platform is also governed by our <a href="/privacy">Privacy Policy</a>, which is incorporated
            into these Terms by reference. By using the Platform, you consent to the collection and use of your
            information as described in the Privacy Policy.
          </p>
        </section>

        <section id="liability" className="policy-section">
          <h2>10. Limitation of Liability</h2>
          <p>To the fullest extent permitted by applicable law, Furzo shall not be liable for:</p>
          <ul>
            <li>Any indirect, incidental, special, or consequential damages arising from your use of the Platform.</li>
            <li>Any loss of data, revenue, or profits.</li>
            <li>Any harm to animals arising from delays, errors, or failures in rescue coordination through the Platform.</li>
            <li>The conduct or actions of third-party veterinarians, NGOs, or users on the Platform.</li>
          </ul>
          <div className="policy-highlight-box">
            <p>
              Our total aggregate liability to you for any claim arising from these Terms or your use of the Platform
              shall not exceed <strong>INR 1,000 (Indian Rupees One Thousand)</strong>.
            </p>
          </div>
        </section>

        <section id="indemnity" className="policy-section">
          <h2>11. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless Furzo, its officers, employees, and agents from any claims,
            losses, damages, liabilities, and expenses (including legal fees) arising from your violation of these Terms,
            your User Content, or your use of the Platform.
          </p>
        </section>

        <section id="governing-law" className="policy-section">
          <h2>12. Governing Law and Dispute Resolution</h2>
          <p>
            These Terms are governed by and construed in accordance with the laws of India. Any disputes arising out of
            or in connection with these Terms shall first be subject to good-faith negotiation. If unresolved within
            30 days, disputes shall be subject to the exclusive jurisdiction of the competent courts of India.
          </p>
        </section>

        <section id="changes" className="policy-section">
          <h2>13. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. We will notify registered users of material changes via email
            or an in-app notification at least 15 days before the changes take effect. Continued use of the Platform
            after such notice constitutes your acceptance of the updated Terms.
          </p>
        </section>

        <section id="contact" className="policy-section">
          <h2>14. Contact Us</h2>
          <p>For questions, concerns, or grievances regarding these Terms, please contact:</p>
          <div className="policy-highlight-box">
            <p><strong>Furzo (StrayCare)</strong></p>
            <p>Email: <a href="mailto:support@furzo.in">support@furzo.in</a></p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Terms;
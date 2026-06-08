import React, { useState, useEffect, useRef } from 'react';
import '../styles/privacy_terms.css';

const SECTIONS = [
  { id: 'introduction', label: '1. Introduction' },
  { id: 'collection', label: '2. Information We Collect' },
  { id: 'usage', label: '3. How We Use Your Information' },
  { id: 'sharing', label: '4. Sharing and Disclosure' },
  { id: 'retention', label: '5. Data Retention' },
  { id: 'security', label: '6. Data Security' },
  { id: 'rights', label: '7. Your Rights' },
  { id: 'cookies', label: '8. Cookies and Tracking' },
  { id: 'children', label: '9. Children\'s Privacy' },
  { id: 'changes', label: '10. Changes to Policy' },
  { id: 'grievance', label: '11. Grievance Officer' },
];

function Privacy() {
  const [activeSection, setActiveSection] = useState('introduction');
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
        <h3>Privacy Policy</h3>
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
          <h1>Privacy Policy</h1>
          <p className="policy-last-updated">Effective Date: June 4, 2026</p>
        </div>

        <section id="introduction" className="policy-section">
          <h2>1. Introduction</h2>
          <p>
            Furzo ("we", "us", "our") is committed to protecting and respecting your privacy.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your personal
            information when you use the Furzo platform (the "Platform"), in accordance with the
            Information Technology Act, 2000, the Information Technology (Reasonable Security
            Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 ("SPDI
            Rules"), and other applicable Indian laws.
          </p>
          <p>
            Please read this policy carefully. By using the Platform, you consent to the practices
            described in this document.
          </p>
        </section>

        <section id="collection" className="policy-section">
          <h2>2. Information We Collect</h2>

          <h3>2.1 Information You Provide Directly</h3>
          <ul>
            <li>
              <strong>Name and email address</strong> — collected during account registration and used for account management and communications.
            </li>
            <li>
              <strong>Phone number</strong> — collected for account verification (OTP-based), emergency contact purposes, and in-platform communication.
            </li>
            <li>
              <strong>Profile information</strong> — optional details such as your role (general user, veterinarian, NGO).
            </li>
            <li>
              <strong>Animal reports</strong> — descriptions, location, and images of stray or distressed animals you report.
            </li>
            <li>
              <strong>Adoption listings</strong> — information about animals listed for adoption by shelters, NGOs, or individuals.
            </li>
            <li>
              <strong>User-generated content</strong> — posts, rescue stories, and community content you choose to share.
            </li>
          </ul>

          <h3>2.2 Location Information</h3>
          <p>
            With your explicit consent, we collect your device's geographic location (GPS coordinates) for the following purposes:
          </p>
          <ul>
            <li>To tag stray animal reports with accurate location data to enable nearby rescuers and veterinarians to respond.</li>
            <li>To show you nearby rescue cases, veterinarians, and shelters on the Platform.</li>
          </ul>
          <p>
            You may disable location access at any time through your device settings; however, this may limit certain Platform features.
          </p>

          <h3>2.3 Images and Media</h3>
          <p>
            Images you upload (photographs of animals, profile pictures, community posts) are stored on our servers.
            By uploading an image, you confirm you have the right to share it and grant us a licence to display it in
            accordance with our Terms of Service.
          </p>

          <h3>2.4 Information Collected Automatically</h3>
          <ul>
            <li><strong>Device information</strong> — device type, operating system, and browser type.</li>
            <li><strong>Usage data</strong> — pages visited, features used, and time spent on the Platform.</li>
            <li><strong>Log data</strong> — IP address, access times, and error logs.</li>
            <li><strong>Cookies and similar technologies</strong> — used for session management and Platform functionality.</li>
          </ul>
        </section>

        <section id="usage" className="policy-section">
          <h2>3. How We Use Your Information</h2>
          <p>We use your personal information for the following purposes:</p>
          <ul>
            <li>Account creation, authentication, and management.</li>
            <li>Sending OTP verification codes and account-related notifications via email.</li>
            <li>Enabling animal rescue coordination by sharing report location and details with nearby veterinarians, NGOs, and rescue organizations.</li>
            <li>Facilitating the adoption process by displaying listings to prospective adopters.</li>
            <li>Providing AI-powered pet care guidance through the Platform's assistant feature.</li>
            <li>Improving the Platform through usage analytics and feedback.</li>
            <li>Communicating important updates, policy changes, or service announcements.</li>
            <li>Complying with legal obligations under applicable Indian law.</li>
          </ul>
          <div className="policy-highlight-box">
            <p>We do not use your personal information for purposes incompatible with those listed above without obtaining your additional consent.</p>
          </div>
        </section>

        <section id="sharing" className="policy-section">
          <h2>4. Sharing and Disclosure of Information</h2>

          <h3>4.1 Within the Platform</h3>
          <p>
            Animal report details (location, description, images) are shared with registered veterinarians, NGOs,
            and rescue organizations operating near the reported location. This is the core functionality of
            the Platform and is necessary to facilitate rescue.
          </p>

          <h3>4.2 Service Providers</h3>
          <p>
            We engage trusted third-party service providers to support Platform operations, including:
          </p>
          <ul>
            <li>Cloud hosting and data storage providers.</li>
            <li>Email delivery services (for OTP and transactional emails).</li>
            <li>Analytics platforms for usage monitoring.</li>
          </ul>
          <p>
            These providers are contractually bound to process your data only for the specified purpose
            and to maintain appropriate security standards.
          </p>

          <h3>4.3 Legal Requirements</h3>
          <p>
            We may disclose your information to law enforcement agencies, courts, or government authorities
            where required by applicable Indian law, court order, or to protect the rights, safety, or property
            of Furzo, our users, or the public.
          </p>

          <h3>4.4 We Do Not Sell Your Data</h3>
          <p>
            Furzo does not sell, rent, or trade your personal information to third parties for their independent
            marketing or commercial purposes.
          </p>
        </section>

        <section id="retention" className="policy-section">
          <h2>5. Data Retention</h2>
          <p>
            We retain your personal data for as long as your account remains active or as necessary to provide
            Services to you. Upon account deletion, we will delete or anonymize your personal information within 30 days,
            except where we are required to retain it under applicable law (e.g., financial records, legal holds).
          </p>
          <p>
            Animal report data may be retained in anonymized or aggregated form for research and welfare improvement purposes.
          </p>
        </section>

        <section id="security" className="policy-section">
          <h2>6. Data Security</h2>
          <p>We implement reasonable security practices as required under the SPDI Rules, 2011, including:</p>
          <ul>
            <li>Encryption of sensitive data in transit (TLS/HTTPS).</li>
            <li>Secure storage of credentials (passwords are hashed and never stored in plain text).</li>
            <li>OTP-based authentication for account verification.</li>
            <li>Access controls limiting employee access to personal data on a need-to-know basis.</li>
          </ul>
          <p>
            While we take reasonable measures to protect your data, no system is completely secure.
            We cannot guarantee absolute security and are not liable for unauthorized access resulting
            from circumstances beyond our reasonable control.
          </p>
        </section>

        <section id="rights" className="policy-section">
          <h2>7. Your Rights</h2>
          <p>Under applicable Indian law and our policy, you have the right to:</p>
          <ul>
            <li><strong>Access</strong> — request a copy of the personal data we hold about you.</li>
            <li><strong>Correction</strong> — request correction of inaccurate or incomplete data.</li>
            <li><strong>Deletion</strong> — request deletion of your account and associated personal data, subject to legal retention requirements.</li>
            <li><strong>Withdrawal of Consent</strong> — withdraw consent for data collection (e.g., location access) at any time, which may affect Platform functionality.</li>
            <li><strong>Grievance Redressal</strong> — lodge a complaint with our Grievance Officer (see Section 11).</li>
          </ul>
          <p>
            To exercise any of these rights, contact us at <a href="mailto:furzo.app@gmail.com">furzo.app@gmail.com</a>.
            We will respond within 30 days of receipt.
          </p>
        </section>

        <section id="cookies" className="policy-section">
          <h2>8. Cookies and Tracking Technologies</h2>
          <p>
            We use cookies and similar technologies (e.g., local storage tokens) to maintain your session,
            remember preferences, and analyze Platform usage. You may configure your browser to refuse cookies;
            however, this may affect your ability to use certain features of the Platform.
          </p>
          <p>
            We do not use third-party advertising cookies or cross-site tracking.
          </p>
        </section>

        <section id="children" className="policy-section">
          <h2>9. Children's Privacy</h2>
          <p>
            The Platform is not directed at children under 18 years of age. We do not knowingly collect personal
            information from minors without verifiable parental consent. If we become aware that we have inadvertently
            collected personal information from a minor, we will delete it promptly. If you believe a minor has
            provided us with personal information, please contact us at <a href="mailto:furzo.app@gmail.com">furzo.app@gmail.com</a>.
          </p>
        </section>

        <section id="changes" className="policy-section">
          <h2>10. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices or applicable law.
            We will notify you of material changes by email or prominent in-app notice at least 15 days before the
            changes take effect. The updated policy will display the revised effective date at the top of the document.
          </p>
        </section>

        <section id="grievance" className="policy-section">
          <h2>11. Grievance Officer</h2>
          <p>
            In accordance with the Information Technology Act, 2000, and Rules made thereunder, we have designated
            a Grievance Officer to address privacy-related complaints:
          </p>
          <div className="policy-highlight-box">
            <p><strong>Grievance Officer — Furzo (StrayCare)</strong></p>
            <p>Email: <a href="mailto:furzo.app@gmail.com">furzo.app@gmail.com</a></p>
            <p>Response Time: Within 72 hours of complaint.</p>
            <p>Resolution Target: Within 30 days as required under applicable law.</p>
          </div>
          <p>
            If you have any other questions about this Privacy Policy or how we handle your data, please contact
            us at <a href="mailto:furzo.app@gmail.com">furzo.app@gmail.com</a>.
          </p>
        </section>
      </main>
    </div>
  );
}

export default Privacy;
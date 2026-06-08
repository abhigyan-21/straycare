import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import '../styles/privacy_terms.css';

const SECTIONS = [
    { id: 'FAQ1', label: '1. What is Furzo?' },
    { id: 'FAQ2', label: '2. Who can use Furzo?' },
    { id: 'FAQ3', label: '3. How do I report a stray animal?' },
    { id: 'FAQ4', label: '4. How does Furzo help injured animals?' },
    { id: 'FAQ5', label: '5. Can I track the status of a reported animal?' },
    { id: 'FAQ6', label: '6. Does Furzo support pet adoption?' },
    { id: 'FAQ7', label: '7. What is the AI Pet Assistant?' },
    { id: 'FAQ8', label: '8. Can veterinarians join the platform?' },
    { id: 'FAQ9', label: '9. What is the Vet Portal?' },
    { id: 'FAQ10', label: '10. Can NGOs use Furzo?' },
    { id: 'FAQ11', label: '11. Is location information required?' },
    { id: 'FAQ12', label: '12. Can users upload photos and updates?' },
    { id: 'FAQ13', label: '13. Does Furzo work like social media?' },
    { id: 'FAQ14', label: '14. Is Furzo free to use?' },
    { id: 'FAQ15', label: '15. How does Furzo ensure genuine reports?' },
    { id: 'FAQ16', label: '16. Can I volunteer for animal rescue?' },
    { id: 'FAQ17', label: '17. What types of animals can be reported?' },
    { id: 'FAQ18', label: '18. Is my personal information secure?' },
    { id: 'FAQ19', label: '19. Can I contact veterinarians directly?' },
    { id: 'FAQ20', label: '20. What problem does Furzo solve?' },
];

function FAQ() {
    const [activeSection, setActiveSection] = useState('FAQ1');
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
        <>
         <Helmet>
            <title>Furzo - Frequently Asked Questions</title>
            <meta name="description" content="Find answers to common questions about Furzo - animal rescue reporting, pet adoption, vet portal, and more." />
            <meta property="og:title" content="Furzo - Frequently Asked Questions" />
            <meta property="og:description" content="Find answers to common questions about Furzo - animal rescue reporting, pet adoption, vet portal, and more." />
            <meta property="og:image" content="https://furzo.vercel.app/FurzoBanner.png" />
            <meta property="og:url" content="https://furzo.vercel.app/faq" />
            <meta property="og:type" content="website" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="Furzo - Frequently Asked Questions" />
            <meta name="twitter:description" content="Find answers to common questions about Furzo - animal rescue reporting, pet adoption, vet portal, and more." />
            <meta name="twitter:image" content="https://furzo.vercel.app/FurzoBanner.png" />
            <script type="application/ld+json">
                {JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    "mainEntity": [
                        {
                            "@type": "Question",
                            "name": "What is Furzo?",
                            "acceptedAnswer": { "@type": "Answer", "text": "Furzo is a platform that helps people report injured, sick, abandoned, or distressed animals and connect them with nearby veterinarians, NGOs, rescue organizations, and volunteers. It also supports pet adoption, rescue tracking, community engagement, and AI-powered pet guidance." }
                        },
                        {
                            "@type": "Question",
                            "name": "Who can use Furzo?",
                            "acceptedAnswer": { "@type": "Answer", "text": "Anyone can use Furzo, including animal lovers, pet owners, volunteers, veterinarians, clinics, NGOs, shelters, and rescue organizations." }
                        },
                        {
                            "@type": "Question",
                            "name": "How do I report a stray animal?",
                            "acceptedAnswer": { "@type": "Answer", "text": "Users can create a report by uploading photos, providing the animal's location, describing its condition, and submitting the report through the platform." }
                        },
                        {
                            "@type": "Question",
                            "name": "How does Furzo help injured animals?",
                            "acceptedAnswer": { "@type": "Answer", "text": "Once a report is submitted, nearby veterinarians, NGOs, and volunteers can view the case, coordinate rescue efforts, provide treatment, and update the rescue status." }
                        },
                        {
                            "@type": "Question",
                            "name": "Can I track the status of a reported animal?",
                            "acceptedAnswer": { "@type": "Answer", "text": "Yes. Users can monitor rescue progress through different stages such as Reported, Assigned, Under Treatment, Recovered, and Adopted." }
                        },
                        {
                            "@type": "Question",
                            "name": "Does Furzo support pet adoption?",
                            "acceptedAnswer": { "@type": "Answer", "text": "Yes. Users, shelters, and NGOs can list animals available for adoption, while potential adopters can browse listings and connect with the responsible organization." }
                        },
                        {
                            "@type": "Question",
                            "name": "What is the AI Pet Assistant?",
                            "acceptedAnswer": { "@type": "Answer", "text": "The AI Pet Assistant provides guidance on pet care, nutrition, basic first-aid, common health concerns, and general pet-related questions. It is not a substitute for professional veterinary care." }
                        },
                        {
                            "@type": "Question",
                            "name": "Can veterinarians join the platform?",
                            "acceptedAnswer": { "@type": "Answer", "text": "Yes. Veterinarians and clinics can register on the platform, receive rescue requests, manage cases, update treatment information, and communicate with users." }
                        },
                        {
                            "@type": "Question",
                            "name": "What is the Vet Portal?",
                            "acceptedAnswer": { "@type": "Answer", "text": "The Vet Portal is a dedicated dashboard that allows veterinarians and clinics to manage rescue cases, track treatment progress, update records, and coordinate with rescuers and NGOs." }
                        },
                        {
                            "@type": "Question",
                            "name": "Can NGOs use Furzo?",
                            "acceptedAnswer": { "@type": "Answer", "text": "Yes. NGOs and shelters can manage rescue operations, receive reports, coordinate volunteers, track animal recovery, and publish adoption listings." }
                        },
                        {
                            "@type": "Question",
                            "name": "Is location information required?",
                            "acceptedAnswer": { "@type": "Answer", "text": "Accurate location information helps rescuers and veterinarians quickly find animals in need and provide timely assistance." }
                        },
                        {
                            "@type": "Question",
                            "name": "Can users upload photos and updates?",
                            "acceptedAnswer": { "@type": "Answer", "text": "Yes. Users can upload images, rescue updates, treatment progress, recovery stories, and adoption success stories." }
                        },
                        {
                            "@type": "Question",
                            "name": "Does Furzo work like social media?",
                            "acceptedAnswer": { "@type": "Answer", "text": "Partially. Users can share pet-related content, rescue stories, awareness posts, and interact with the animal welfare community." }
                        },
                        {
                            "@type": "Question",
                            "name": "Is Furzo free to use?",
                            "acceptedAnswer": { "@type": "Answer", "text": "The core features of Furzo, including animal reporting, rescue coordination, community participation, and adoption support, are intended to be free for users." }
                        },
                        {
                            "@type": "Question",
                            "name": "How does Furzo ensure genuine reports?",
                            "acceptedAnswer": { "@type": "Answer", "text": "The platform encourages photo evidence, location verification, status updates, and community moderation to help maintain report authenticity." }
                        },
                        {
                            "@type": "Question",
                            "name": "Can I volunteer for animal rescue?",
                            "acceptedAnswer": { "@type": "Answer", "text": "Yes. Interested users can register as volunteers and receive notifications about rescue opportunities and animal welfare activities nearby." }
                        },
                        {
                            "@type": "Question",
                            "name": "What types of animals can be reported?",
                            "acceptedAnswer": { "@type": "Answer", "text": "Users can report dogs, cats, birds, cattle, and other stray, abandoned, injured, or distressed animals that require assistance." }
                        },
                        {
                            "@type": "Question",
                            "name": "Is my personal information secure?",
                            "acceptedAnswer": { "@type": "Answer", "text": "Yes. Furzo follows standard security practices to protect user data and ensure that personal information is handled responsibly." }
                        },
                        {
                            "@type": "Question",
                            "name": "Can I contact veterinarians directly?",
                            "acceptedAnswer": { "@type": "Answer", "text": "Depending on platform permissions and availability, users may request consultations or connect with registered veterinarians through the platform." }
                        },
                        {
                            "@type": "Question",
                            "name": "What problem does Furzo solve?",
                            "acceptedAnswer": { "@type": "Answer", "text": "Furzo bridges the gap between people who find animals in need and the organizations or professionals capable of helping them. It streamlines rescue, treatment, recovery tracking, and adoption through a single connected platform." }
                        }
                    ]
                })}
            </script>
        </Helmet>
        <div className="policy-container">
            <aside className="policy-sidebar">
                <h3>Frequently Asked Questions</h3>
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
                    <h1>Frequently Asked Questions</h1>
                    <p className="policy-last-updated">Last Updated: June 2026</p>
                </div>

                <section id="FAQ1" className="policy-section">
                    <h2>1. What is Furzo?</h2>
                    <p>
                        Furzo (Furzo) is a platform that helps people report injured, sick,
                        abandoned, or distressed animals and connect them with nearby veterinarians,
                        NGOs, rescue organizations, and volunteers. It also supports pet adoption,
                        rescue tracking, community engagement, and AI-powered pet guidance.
                    </p>
                </section>

                <section id="FAQ2" className="policy-section">
                    <h2>2. Who can use Furzo?</h2>
                    <p>
                        Anyone can use Furzo, including animal lovers, pet owners, volunteers,
                        veterinarians, clinics, NGOs, shelters, and rescue organizations.
                    </p>
                </section>

                <section id="FAQ3" className="policy-section">
                    <h2>3. How do I report a stray animal?</h2>
                    <p>
                        Users can create a report by uploading photos, providing the animal's
                        location, describing its condition, and submitting the report through the
                        platform.
                    </p>
                </section>

                <section id="FAQ4" className="policy-section">
                    <h2>4. How does Furzo help injured animals?</h2>
                    <p>
                        Once a report is submitted, nearby veterinarians, NGOs, and volunteers can
                        view the case, coordinate rescue efforts, provide treatment, and update the
                        rescue status.
                    </p>
                </section>

                <section id="FAQ5" className="policy-section">
                    <h2>5. Can I track the status of a reported animal?</h2>
                    <p>
                        Yes. Users can monitor rescue progress through different stages such as
                        Reported, Assigned, Under Treatment, Recovered, and Adopted.
                    </p>
                </section>

                <section id="FAQ6" className="policy-section">
                    <h2>6. Does Furzo support pet adoption?</h2>
                    <p>
                        Yes. Users, shelters, and NGOs can list animals available for adoption,
                        while potential adopters can browse listings and connect with the
                        responsible organization.
                    </p>
                </section>

                <section id="FAQ7" className="policy-section">
                    <h2>7. What is the AI Pet Assistant?</h2>
                    <p>
                        The AI Pet Assistant provides guidance on pet care, nutrition, basic
                        first-aid, common health concerns, and general pet-related questions. It is
                        not a substitute for professional veterinary care.
                    </p>
                </section>

                <section id="FAQ8" className="policy-section">
                    <h2>8. Can veterinarians join the platform?</h2>
                    <p>
                        Yes. Veterinarians and clinics can register on the platform, receive rescue
                        requests, manage cases, update treatment information, and communicate with
                        users.
                    </p>
                </section>

                <section id="FAQ9" className="policy-section">
                    <h2>9. What is the Vet Portal?</h2>
                    <p>
                        The Vet Portal is a dedicated dashboard that allows veterinarians and
                        clinics to manage rescue cases, track treatment progress, update records,
                        and coordinate with rescuers and NGOs.
                    </p>
                </section>

                <section id="FAQ10" className="policy-section">
                    <h2>10. Can NGOs use Furzo?</h2>
                    <p>
                        Yes. NGOs and shelters can manage rescue operations, receive reports,
                        coordinate volunteers, track animal recovery, and publish adoption
                        listings.
                    </p>
                </section>

                <section id="FAQ11" className="policy-section">
                    <h2>11. Is location information required?</h2>
                    <p>
                        Accurate location information helps rescuers and veterinarians quickly find
                        animals in need and provide timely assistance.
                    </p>
                </section>

                <section id="FAQ12" className="policy-section">
                    <h2>12. Can users upload photos and updates?</h2>
                    <p>
                        Yes. Users can upload images, rescue updates, treatment progress, recovery
                        stories, and adoption success stories.
                    </p>
                </section>

                <section id="FAQ13" className="policy-section">
                    <h2>13. Does Furzo work like social media?</h2>
                    <p>
                        Partially. Users can share pet-related content, rescue stories, awareness
                        posts, and interact with the animal welfare community.
                    </p>
                </section>

                <section id="FAQ14" className="policy-section">
                    <h2>14. Is Furzo free to use?</h2>
                    <p>
                        The core features of Furzo, including animal reporting, rescue
                        coordination, community participation, and adoption support, are intended
                        to be free for users.
                    </p>
                </section>

                <section id="FAQ15" className="policy-section">
                    <h2>15. How does Furzo ensure genuine reports?</h2>
                    <p>
                        The platform encourages photo evidence, location verification, status
                        updates, and community moderation to help maintain report authenticity.
                    </p>
                </section>

                <section id="FAQ16" className="policy-section">
                    <h2>16. Can I volunteer for animal rescue?</h2>
                    <p>
                        Yes. Interested users can register as volunteers and receive notifications
                        about rescue opportunities and animal welfare activities nearby.
                    </p>
                </section>

                <section id="FAQ17" className="policy-section">
                    <h2>17. What types of animals can be reported?</h2>
                    <p>
                        Users can report dogs, cats, birds, cattle, and other stray, abandoned,
                        injured, or distressed animals that require assistance.
                    </p>
                </section>

                <section id="FAQ18" className="policy-section">
                    <h2>18. Is my personal information secure?</h2>
                    <p>
                        Yes. Furzo follows standard security practices to protect user data and
                        ensure that personal information is handled responsibly.
                    </p>
                </section>

                <section id="FAQ19" className="policy-section">
                    <h2>19. Can I contact veterinarians directly?</h2>
                    <p>
                        Depending on platform permissions and availability, users may request
                        consultations or connect with registered veterinarians through the
                        platform.
                    </p>
                </section>

                <section id="FAQ20" className="policy-section">
                    <h2>20. What problem does Furzo solve?</h2>
                    <p>
                        Furzo bridges the gap between people who find animals in need and the
                        organizations or professionals capable of helping them. It streamlines
                        rescue, treatment, recovery tracking, and adoption through a single
                        connected platform.
                    </p>

                    <div className="policy-highlight-box">
                        <p><strong>Still have questions?</strong></p>
                        <p>Email: furzo.app@gmail.com</p>
                        <p>We will respond as soon as possible.</p>
                    </div>
                </section>
            </main>
        </div>
        </>
    );
}

export default FAQ;
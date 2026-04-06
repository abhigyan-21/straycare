# Software Requirements Specification (SRS) for StrayCare Backend

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for the backend of the **StrayCare** platform. The backend will act as the central system for managing stray animal reporting, rescues, adoptions, and funding.

### 1.2 Scope
StrayCare is a global platform designed to assist stray animals by connecting people who find them with rescuers, veterinarians, and people looking to adopt. The platform handles everything from the initial report (including geolocation and photos) to medical tracking, adoption workflows, and crowdfunding for specific animals' treatments. It also features a community feed to keep users engaged and updated.

## 2. Overall Description

### 2.1 Product Perspective
The backend will primarily expose a RESTful API consumed by the StrayCare frontend (web and potentially mobile apps). It will integrate with several third-party services for payments, media storage, geolocation, and authentication.

### 2.2 User Roles & Permissions
The system will implement Role-Based Access Control (RBAC) with the following roles:
1. **General/Guest User**: Can browse the community feed, view available animals, and report a stray (guest reports might require email verification).
2. **Registered User**: Can apply for adoption/fostering, make donations to campaigns, track status of their reported strays, and interact with the community feed.
3. **Rescuer / Volunteer / NGO**: Can claim "stray reports", update the rescue status, upload new photos/videos, and update general records for the animal.
4. **Veterinarian / Clinic**: Can access and update the official medical records and treatment history of an animal.
5. **System Admin**: Manages user roles, verifies NGOs and clinics, moderates community feed content, and oversees platform financials.

## 3. Functional Requirements

### 3.1 Authentication & Authorization
- Implement OAuth 2.0 integration (e.g., Google, Facebook) for seamless and free user authentication.
- Secure API endpoints using JWT (JSON Web Tokens).

### 3.2 Stray Reporting & Status Tracking
- **Report Creation**: Users can submit a report containing photos, descriptions, and highly accurate geolocation data (latitude/longitude coordinates).
- **Status Pipeline**: The system must track the animal's lifecycle status (e.g., *Reported &rarr; Rescue in Progress &rarr; Admitted to Clinic &rarr; Treated &rarr; Fostered &rarr; Adopted*).
- **Media Uploads**: Secure endpoints for uploading and serving images of the strays.

### 3.3 Adoption & Fostering Workflow
- **Application Processing**: Registered users can submit detailed forms to apply for adopting or fostering a specific animal.
- **Physical Verification Step**: The system will support a workflow state where an applicant is conditionally approved and invited to the center for a physical visit and final verification before the adoption is finalized.

### 3.4 Donations & Funding (Stripe Integration)
- **Campaigns**: NGOs/Admins can create support campaigns for specific animals with funding goals.
- **General Donations**: The platform can accept general pool donations.
- **Payments**: Integration with Stripe to securely process one-time or recurring donations. Provide webhooks to confirm payment success.

### 3.5 Community Feed / Forum
- **Posts**: Users can create posts sharing updates, stories, or pictures of strays.
- **Engagement**: Users can like and comment on community feed posts.

### 3.6 Notifications
- **Push/Email/SMS**: Notify users when the status of their reported stray changes, when their adoption application is updated, or to send donation receipts.

## 4. Proposed Technical Stack

Since a tech stack hasn't been chosen yet, the following constitutes a highly recommended, modern setup for this type of application:

- **Language & Framework**: Node.js with Express.js (or Python with Django/FastAPI). Node.js is excellent for I/O heavy operations like handling feed requests and multiple concurrent uploads.
- **Database**: PostgreSQL. A relational database is highly recommended here because the relationships between users, animals, medical records, and donations are complex and require strong data integrity (ACID compliance).
- **Media Storage**: AWS S3 or Cloudinary to securely store photos and handle image optimization.
- **Authentication**: Firebase Authentication or Auth0 (generous free tiers with easy OAuth out-of-the-box).
- **Payment Gateway**: Stripe API.
- **Real-time Features**: Socket.io (if using Node.js) for real-time feed updates and immediate notifications.

## 5. Non-Functional Requirements
- **Scalability**: The architecture should be stateless to allow horizontal scaling as the platform grows globally.
- **Security**: All communication must be encrypted via HTTPS. Passwords (if any) hashed via bcrypt. Strict CORS policies.
- **Performance**: API response times should aim to be under 200ms for standard CRUD operations.
- **Reliability**: Use of robust error logging and monitoring (e.g., Sentry) to ensure 99.9% uptime.

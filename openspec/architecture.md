# Architecture Specification

## Overview
This document outlines the high-level architecture of the StrayCare (Furzo) application. The project is split into a frontend and a backend, containerized via Docker.

## Tech Stack
### Frontend
- **Framework**: React 19 via Vite
- **Routing**: React Router DOM
- **State Management**: Zustand
- **Real-time**: Socket.IO Client
- **Maps**: Leaflet & React-Leaflet
- **Styling & Assets**: Lucide-React (Icons)
- **Deployment & Analytics**: Vercel Analytics / Speed Insights

### Backend
- **Framework**: Node.js with Express 5
- **Database & ORM**: PostgreSQL with Prisma ORM (`@prisma/adapter-pg`)
- **Authentication**: JWT, bcryptjs
- **Real-time**: Socket.IO
- **Third-party Integrations**: 
  - Payment: Razorpay
  - Emails: Brevo / Nodemailer
  - SMS: Twilio
  - Storage: Cloudinary (Integrated via `multer` for image uploads on Posts)

### Infrastructure
- **Containerization**: Docker & Docker Compose (`docker-compose.yml` defines `frontend` on port 80 and `backend` on port 5000).

## Folder Structure
```text
straycare/
├── backend/
│   ├── db/            # Database configurations/migrations
│   ├── features/      # Feature modules (controllers, routes)
│   ├── prisma/        # Prisma schema and configuration
│   ├── scripts/       # Utility and setup scripts
│   ├── services/      # Third-party service integrations
│   ├── utils/         # Helper functions
│   ├── index.js       # Main entry point for the backend
│   └── package.json   # Backend dependencies
├── frontend/
│   ├── public/        # Static assets
│   ├── src/           # React application source code
│   ├── index.html     # Frontend entry point
│   ├── vite.config.js # Vite configuration
│   └── package.json   # Frontend dependencies
└── docker-compose.yml # Container definitions
```

## Major Entry Points
- **Backend Entry Point**: `/backend/index.js` (runs on port 5000)
  - Key APIs include: `/api/posts` (Feed & Interactions), `/api/auth`, `/api/reports`, etc.
- **Frontend Entry Point**: `/frontend/index.html` (runs Vite dev server or builds via Vite, served on port 80 in Docker)

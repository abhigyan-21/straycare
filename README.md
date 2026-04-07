# StrayCare 🐾

A comprehensive digital ecosystem dedicated to the welfare of stray animals. StrayCare bridges the gap between stray animals in need and the community of rescuers, veterinarians, and adopters throughout their journey of recovery and rehoming.

## 🌟 Key Features

### 🏡 Community & Impact
- **Journey & Impact Stories**: Dynamic storytelling section on the homepage highlighting successful rescues and community efforts.
- **Top Supporters**: Celebrating the heroes who contribute most to our cause.
- **Latest Campaigns**: Real-time progress tracking for specialized drives like "Winter Warmth."

### 🆘 Interactive Help Center
- **Infinite Support Carousel**: A premium, seamless carousel on the Help page where users can choose to support feeding, treatment, or shelter initiatives.
- **Volunteer Integration**: Dedicated flow for users to join active campaigns and volunteer their time.
- **Emergency SOS**: Quick-access reporting for animals in critical condition.

### 📊 Management & Tracking
- **Admin Dashboard**: Comprehensive hub for managing stray tracking, document verification, adoptions, and community content.
- **Protected Routes**: Secure access levels for Admins, Partners, and NGOs.
- **Report Lifecycle**: End-to-end tracking from initial report to final adoption status.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Styling**: Premium Vanilla CSS (Custom light theme: `#fcfdf9`)
- **Navigation**: React Router DOM v7
- **Design Principles**: High-fidelity glassmorphism, smooth micro-animations, and responsive layouts.

### Backend
- **Server**: Node.js / Express
- **Database**: PostgreSQL (via Prisma ORM)
- **Security**: JWT-based Authentication, Bcrypt password hashing, and Rate Limiting.
- **Architecture**: Modular feature-based routing and controllers.

## 📂 Project Structure

```text
StrayCare/
├── frontend/           # React client application
│   ├── src/
│   │   ├── components/ # Modular UI components (Navbar, Hero, Carousel, etc.)
│   │   ├── pages/      # Main page views (Home, Help, Admin, Profile)
│   │   ├── styles/     # Global and component-specific Vanilla CSS
│   │   └── data/       # Mock data and configuration files
├── backend/            # Express server & API
│   ├── features/       # Feature-specific routes and controllers
│   ├── prisma/         # Database schema and migrations
│   └── index.js        # Server entry point
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL instance

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/abhigyan-21/straycare.git
   ```
2. Setup Backend:
   ```bash
   cd backend
   npm install
   npx prisma generate
   npm run dev
   ```
3. Setup Frontend:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

## 🤝 Contributing

We welcome contributions to help make the world a better place for our furry friends! Please feel free to open issues or submit pull requests.

## 📄 License

This project is licensed under the MIT License.

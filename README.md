# Furzo🐾 
### *Connecting Hearts, Saving Lives.*

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Real--time-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Furzo is a comprehensive digital ecosystem dedicated to the welfare of stray animals. It bridges the critical gap between stray animals in need and the community of rescuers, veterinarians, and adopters throughout their journey of recovery and rehoming.

---

## 🌍 The Cause: Why Furzo?

Across the globe, millions of stray animals suffer from neglect, injury, and lack of basic care. The process of rescuing an animal is often fragmented—communication is slow, medical records are lost, and finding forever homes is a struggle.

**Furzo exists to change this.** 
By centralizing the rescue lifecycle, we empower the community to:
- **Respond Faster**: Instant SOS reporting reduces response time for critical injuries.
- **Treat Better**: Dedicated vet portals ensure medical history is always accessible.
- **Connect Deeper**: Real-time communication and transparent impact stories build a stronger, more informed community of animal lovers.

---

## 🌟 Key Features

### 🏢 Specialized Portals
Furzo provides tailored experiences for every stakeholder in the ecosystem:
- **👤 User & Rescuer Portal**: A seamless interface to report strays, track their status, and browse potential adoptions.
- **🩺 Vet Portal**: A medical-first dashboard where veterinarians can manage treatment plans, update recovery status, and view historical medical data.
- **🛡️ Admin Command Center**: A robust hub for verifying rescuer credentials, managing community campaigns, and overseeing the entire platform's data.

### 🆘 Interactive & Real-time Tools
- **🚨 Emergency SOS Engine**: A floating, high-visibility SOS button allows anyone to report an animal in distress within seconds.
- **💬 Real-Time Coordination**: Integrated chat system powered by **Socket.io** enables instant communication between rescuers and assigned veterinarians.
- **📍 Live Mapping & Tracking**: Integration with **Leaflet.js** provides precise geolocation for rescue reports, ensuring rescuers find animals without delay.
- **💳 Transparent Funding**: Secure donation workflows integrated with **Razorpay** for specific campaigns like "Winter Warmth" or emergency surgeries.

### 📈 Impact & Transparency
- **Journey Stories**: Dynamic storytelling that tracks a stray's progress from "Rescued" to "Recovered" to "Adopted."
- **Leaderboards**: Celebrating the top supporters and rescuers who drive the community forward.

---

## 🛠️ Tech Stack

### Frontend: The Interface
- **React 19 (Vite)**: For a high-performance, reactive UI.
- **Vanilla CSS**: Custom-crafted **Glassmorphism** and fluid micro-animations for a premium feel.
- **React Router DOM v7**: Managing complex portal-based navigation.
- **Leaflet & Lucide**: For interactive mapping and beautiful, consistent iconography.

### Backend: The Engine
- **Node.js & Express 5**: A scalable and modern server architecture.
- **PostgreSQL & Prisma**: Type-safe database management with high-performance queries.
- **Socket.io**: Enabling the low-latency real-time chat system.
- **Bcrypt & JWT**: Industry-standard security for authentication and data protection.

---

## 📂 Project Structure

```text
Furzo/
├── frontend/               # The React Client
│   ├── src/
│   │   ├── components/     # Atomic UI components (User, Admin, Vet specific)
│   │   ├── pages/          # Full page views for different portals
│   │   ├── services/       # API connectors and Socket handlers
│   │   ├── context/        # Global state (Auth, UI states)
│   │   └── styles/         # Custom design tokens and component CSS
├── backend/                # The API Server
│   ├── features/           # Domain-driven modules (Adoptions, Chat, Medical, SOS)
│   ├── prisma/             # Schema definitions and database migrations
│   ├── db/                 # Database initialization and client config
│   └── index.js            # Entry point
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- Razorpay API Keys (Optional for donations)

### Quick Start

1. **Clone & Install**:
   ```bash
   git clone https://github.com/abhigyan-21/straycare.git
   cd straycare
   ```

2. **Backend Configuration**:
   - Create `backend/.env`:
     ```env
     DATABASE_URL="postgresql://user:pass@localhost:5432/Furzo"
     JWT_SECRET="your_secret_key"
     ```
   ```bash
   cd backend
   npm install
   npx prisma generate
   npm run dev
   ```

3. **Frontend Configuration**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

---

## 🤝 Join the Mission

We are always looking for developers, designers, and animal lovers to help improve Furzo.
- **Open an Issue**: Found a bug or have a feature idea? Let us know!
- **Submit a PR**: We love contributions!

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Made with ❤️ for the animals.*

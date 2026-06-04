require('dotenv').config();
const dns = require('dns');
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}
const express = require('express');
const cors = require('cors');

// Routes Import
const chatRoutes = require('./features/chat/chat.route');
const authRoutes = require('./features/auth/auth.route');
const reportRoutes = require('./features/reports/report.route');
const adoptionRoutes = require('./features/adoptions/adoption.route');
const feedRoutes = require('./features/feed/feed.route');
const fundingRoutes = require('./features/funding/funding.route');
const userRoutes = require('./features/users/user.route');
const medicalRoutes = require('./features/medical/medical.route');

const http = require('http');
const { Server } = require('socket.io');

const app = express();

// Trust reverse proxy (Render load balancer) for rate limiting and client IP detection
app.set('trust proxy', 1);

// CORS allowed origins list (Vercel production and local dev)
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://furzo.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000'
].filter(Boolean);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

// Socket.io Logic for Tracking
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-track', (reportId) => {
    socket.join(`track-${reportId}`);
    console.log(`Socket ${socket.id} joined tracking room: ${reportId}`);
  });

  socket.on('update-location', (data) => {
    // Expected data: { reportId, lat, lng, arrivalTime }
    io.to(`track-${data.reportId}`).emit('location-updated', {
      lat: data.lat,
      lng: data.lng,
      arrivalTime: data.arrivalTime
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ── Middleware Setup ────────────────────────────────────────

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Fallback for non-production environments
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};

app.use((req, res, next) => {
  console.log(`[Request Log] ${req.method} ${req.url} | IP: ${req.ip} | X-Forwarded-For: ${req.headers['x-forwarded-for']}`);
  next();
});

app.use(cors(corsOptions));
app.use(express.json());

// Favicon dummy handler to prevent console clutter/CSP errors
app.get('/favicon.ico', (req, res) => res.status(204).end());

// ── Apply Routes ─────────────────────────────────────────────
app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/adoptions', adoptionRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/funding', fundingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/medical', medicalRoutes);

// Generic Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: 'error', message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Backend server with Socket.io running on port ${PORT}`);
});

require('dotenv').config();
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
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
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

app.use(cors());
app.use(express.json());

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

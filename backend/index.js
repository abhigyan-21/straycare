require('dotenv').config();
const prisma = require('./db/prisma');
const dns = require('dns');
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Routes Import
const chatRoutes = require('./features/chat/chat.route');

// TEMPORARY: Write all console errors to file so we can see what's crashing
const fs = require('fs');
const originalConsoleError = console.error;
console.error = (...args) => {
  originalConsoleError(...args);
  fs.appendFileSync('backend-global-error.txt', args.map(a => typeof a === 'object' && a?.stack ? a.stack : String(a)).join(' ') + '\n');
};
const authRoutes = require('./features/auth/auth.route');
const reportRoutes = require('./features/reports/report.route');
const adoptionRoutes = require('./features/adoptions/adoption.route');
const feedRoutes = require('./features/feed/feed.route');
const postRoutes = require('./features/posts/post.routes');
const fundingRoutes = require('./features/funding/funding.route');
const userRoutes = require('./features/users/user.route');
const medicalRoutes = require('./features/medical/medical.route');
const adminRoutes = require('./features/admin/admin.route');
const partnerRoutes = require('./features/partners/partner.route');

const http = require('http');
const { Server } = require('socket.io');

const app = express();

// Trust reverse proxy (Render load balancer) for rate limiting and client IP detection
app.set('trust proxy', 1);

// CORS allowed origins list (from environment variables)
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [];

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

app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Favicon dummy handler to prevent console clutter/CSP errors
app.get('/favicon.webp', (req, res) => res.status(204).end());

// Expose io instance to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ── Apply Routes ─────────────────────────────────────────────
app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/adoptions', adoptionRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/funding', fundingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/medical', medicalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/partners', partnerRoutes);

// Generic Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: 'error', message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

// Daily Cleanup Job for Rejected Partner Applications (> 3 days old)
const cleanupRejectedUsers = async () => {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const rejectedUsers = await prisma.user.findMany({
      where: {
        status: 'Rejected',
        updatedAt: {
          lte: threeDaysAgo
        }
      }
    });

    if (rejectedUsers.length > 0) {
      console.log(`[Cleanup] Found ${rejectedUsers.length} rejected users to clean up.`);
      for (const u of rejectedUsers) {
        // Perform cascade deletions
        await prisma.generalVolunteer.deleteMany({ where: { userId: u.id } });
        await prisma.campaignVolunteer.deleteMany({ where: { userId: u.id } });
        await prisma.comment.deleteMany({ where: { userId: u.id } });
        await prisma.comment.deleteMany({ where: { post: { authorId: u.id } } });
        await prisma.post.deleteMany({ where: { authorId: u.id } });
        await prisma.like.deleteMany({ where: { userId: u.id } });
        await prisma.like.deleteMany({ where: { post: { authorId: u.id } } });
        await prisma.donation.deleteMany({ where: { campaign: { createdBy: u.id } } });
        await prisma.campaignVolunteer.deleteMany({ where: { campaign: { createdBy: u.id } } });
        await prisma.campaign.deleteMany({ where: { createdBy: u.id } });
        await prisma.donation.deleteMany({ where: { userId: u.id } });
        await prisma.subscription.deleteMany({ where: { userId: u.id } });
        await prisma.adoptionRequest.deleteMany({ where: { userId: u.id } });
        await prisma.adoptionRequest.deleteMany({ where: { pet: { ownerId: u.id } } });
        await prisma.medicalRecord.deleteMany({ where: { vetId: u.id } });
        await prisma.medicalRecord.deleteMany({ where: { report: { reporterId: u.id } } });
        await prisma.campaign.deleteMany({ where: { report: { reporterId: u.id } } });
        await prisma.pet.deleteMany({ where: { report: { reporterId: u.id } } });
        await prisma.pet.deleteMany({ where: { ownerId: u.id } });
        await prisma.animalReport.deleteMany({ where: { reporterId: u.id } });
        await prisma.petDocument.deleteMany({ where: { userId: u.id } });

        if (u.partnerId) {
          const partnerIdToDelete = u.partnerId;
          await prisma.user.updateMany({
            where: { partnerId: partnerIdToDelete },
            data: { partnerId: null }
          });
          await prisma.partner.deleteMany({ where: { id: partnerIdToDelete } });
        }

        await prisma.user.deleteMany({ where: { id: u.id } });
        console.log(`[Cleanup] Successfully deleted rejected user: ${u.email}`);
      }
    }
  } catch (error) {
    console.error('[Cleanup Error] Failed to run rejected users cleanup:', error);
  }
};

// Run cleanup immediately on startup, then every 24 hours
cleanupRejectedUsers();
setInterval(cleanupRejectedUsers, 24 * 60 * 60 * 1000);

server.listen(PORT, () => {
  console.log(`Backend server with Socket.io running on port ${PORT}`);
});

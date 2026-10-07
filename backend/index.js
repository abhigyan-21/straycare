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

// Socket.io Logic for Tracking and Proximity-based Rescuer Notifications
//
// Rescuers register their location on connect via 'rescuer-register'.
// The server keeps an in-memory map of socketId → { userId, lat, lng } so that
// new-report and report-updated events can be targeted only at nearby rescuers
// instead of broadcasting to every connected client.
//
const RESCUER_NOTIFY_RADIUS_KM = 50;

// In-memory registry: socketId → { userId, lat, lng }
const rescuerSockets = new Map();

function haversineKm(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return Infinity;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Emit an event to all rescuer sockets that are within RESCUER_NOTIFY_RADIUS_KM
 * of the given report location. Falls back to broadcasting to all registered
 * rescuer sockets if the report has no valid coordinates (edge case).
 */
function emitToNearbyRescuers(event, payload, reportLat, reportLng) {
  const hasCoords = reportLat != null && reportLng != null;

  rescuerSockets.forEach(({ lat, lng }, socketId) => {
    if (!hasCoords || haversineKm(reportLat, reportLng, lat, lng) <= RESCUER_NOTIFY_RADIUS_KM) {
      io.to(socketId).emit(event, payload);
    }
  });
}

io.on('connection', (socket) => {
  // Rescuers call this event right after connecting (and after every reconnect)
  // so the server knows their current position for targeted broadcasts.
  // Payload: { userId: string, lat: number, lng: number }
  socket.on('rescuer-register', ({ userId, lat, lng } = {}) => {
    if (userId && lat != null && lng != null) {
      rescuerSockets.set(socket.id, { userId, lat: parseFloat(lat), lng: parseFloat(lng) });
      console.log(`Rescuer registered: userId=${userId} socketId=${socket.id} lat=${lat} lng=${lng}`);
    }
  });

  // Rescuers call this when their position changes (optional, improves accuracy)
  socket.on('rescuer-update-location', ({ lat, lng } = {}) => {
    const existing = rescuerSockets.get(socket.id);
    if (existing && lat != null && lng != null) {
      rescuerSockets.set(socket.id, { ...existing, lat: parseFloat(lat), lng: parseFloat(lng) });
    }
  });

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
    rescuerSockets.delete(socket.id);
    console.log('Client disconnected:', socket.id);
  });
});

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

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});


// Attach io and proximity emitter to every request so route controllers can use them
app.use((req, _res, next) => {
  req.io = io;
  req.emitToNearbyRescuers = emitToNearbyRescuers;
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

const cleanupExpiredCampaigns = async () => {
  try {
    const expiredCampaigns = await prisma.campaign.updateMany({
      where: {
        status: { in: ['ACTIVE', 'ENDING_SOON'] },
        deadline: { lt: new Date() }
      },
      data: {
        status: 'EXPIRED'
      }
    });
    if (expiredCampaigns.count > 0) {
      console.log(`[Cleanup] Marked ${expiredCampaigns.count} campaigns as EXPIRED.`);
    }
  } catch (error) {
    console.error('[Cleanup Error] Failed to expire campaigns:', error);
  }
};
cleanupExpiredCampaigns();
setInterval(cleanupExpiredCampaigns, 60 * 60 * 1000);

const cleanupExpiredReports = async () => {
  try {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const expiredReports = await prisma.animalReport.findMany({
      where: {
        status: { in: ['REPORTED', 'ASSIGNED'] },
        createdAt: { lte: twentyFourHoursAgo }
      },
      select: { id: true }
    });

    let deletedCount = 0;
    for (const report of expiredReports) {
      try {
        await prisma.animalReport.delete({ where: { id: report.id } });
        deletedCount++;
      } catch (err) {
        console.warn(`[Cleanup] Could not delete report ${report.id} (may have linked records): ${err.message}`);
      }
    }

    if (deletedCount > 0) {
      console.log(`[Cleanup] Deleted ${deletedCount} expired rescue requests.`);
    }
  } catch (error) {
    console.error('[Cleanup Error] Failed to cleanup expired reports:', error);
  }
};
cleanupExpiredReports();
setInterval(cleanupExpiredReports, 60 * 60 * 1000);

server.listen(PORT, () => {
  console.log(`Backend server with Socket.io running on port ${PORT}`);
});

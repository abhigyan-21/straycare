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

const app = express();
app.use(cors());
app.use(express.json());

// Apply Routes
app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/adoptions', adoptionRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/funding', fundingRoutes);

// Generic Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: 'error', message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

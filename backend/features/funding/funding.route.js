const express = require('express');
const router = express.Router();
const { verifyToken } = require('../auth/auth.middleware');
const {
  createDonationOrder,
  handleRazorpayWebhook,
} = require('./funding.controller');

// ── Authenticated checkout routes ───────────────────────────────
router.post('/donate', verifyToken, createDonationOrder);

// ── Razorpay webhook (public, standard JSON body) ───────────────
router.post('/webhook', handleRazorpayWebhook);

module.exports = router;

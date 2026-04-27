const express = require('express');
const router = express.Router();
const { verifyToken } = require('../auth/auth.middleware');
const {
  createDonationOrder,
  handleRazorpayWebhook,
  createCampaign,
  getCampaigns,
  updateCampaignStatus,
} = require('./funding.controller');

// ── Authenticated checkout routes ───────────────────────────────
router.post('/donate', verifyToken, createDonationOrder);

// ── Campaign routes ───────────────────────────────
router.post('/campaigns', verifyToken, createCampaign);
router.get('/campaigns', verifyToken, getCampaigns);
router.patch('/campaigns/:id', verifyToken, updateCampaignStatus);

// ── Razorpay webhook (public, standard JSON body) ───────────────
router.post('/webhook', handleRazorpayWebhook);

module.exports = router;

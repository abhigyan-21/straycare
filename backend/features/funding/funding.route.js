const express = require('express');
const router = express.Router();
const { verifyToken } = require('../auth/auth.middleware');
const {
  createDonationOrder,
  handleRazorpayWebhook,
  createCampaign,
  getCampaigns,
  updateCampaignStatus,
  volunteerCampaign,
  cancelVolunteerCampaign,
  checkVolunteerStatus,
  mockDonateCampaign,
} = require('./funding.controller');

// ── Authenticated checkout routes ───────────────────────────────
router.post('/donate', verifyToken, createDonationOrder);

// ── Campaign routes ───────────────────────────────
router.post('/campaigns', verifyToken, createCampaign);
router.get('/campaigns', verifyToken, getCampaigns);
router.patch('/campaigns/:id', verifyToken, updateCampaignStatus);

// ── Volunteering routes (General) ───────────────────────────────
router.post('/campaigns/volunteer', verifyToken, volunteerCampaign);
router.post('/campaigns/volunteer/cancel', verifyToken, cancelVolunteerCampaign);
router.get('/campaigns/volunteer/status', verifyToken, checkVolunteerStatus);

// ── Mock Donation Checkout ──────────────────────────────────────
router.post('/campaigns/:id/donate-mock', verifyToken, mockDonateCampaign);

// ── Razorpay webhook (public, standard JSON body) ───────────────
router.post('/webhook', handleRazorpayWebhook);

module.exports = router;

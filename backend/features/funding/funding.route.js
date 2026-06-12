const express = require('express');
const router = express.Router();
const { verifyToken, optionalVerifyToken } = require('../auth/auth.middleware');
const { upload } = require('../../utils/cloudinary');
const {
  createDonationOrder,
  handleRazorpayWebhook,
  createCampaign,
  getCampaigns,
  updateCampaign,
  deleteCampaign,
  getFundingHighlights,
  volunteerCampaign,
  cancelVolunteerCampaign,
  checkVolunteerStatus,
  mockDonateCampaign,
  notifyNearbyVolunteers,
  confirmVolunteerCampaign,
  getMyDonations,
  cancelSubscription,
  getHubs,
  splitDonate,
  confirmSplit,
  createHubSubscription,
  donateManual,
  updateCampaignProgress,
  cancelVolunteerCampaignEmail,
} = require('./funding.controller');

// ── Authenticated checkout routes ───────────────────────────────
router.post('/donate', verifyToken, createDonationOrder);
router.get('/my-donations', verifyToken, getMyDonations);
router.post('/subscriptions/:id/cancel', verifyToken, cancelSubscription);

// ── Smart Recommendation Hubs ──────────────────────────────────
router.get('/hubs/:category', getHubs);
router.post('/split-donate', verifyToken, splitDonate);
router.post('/confirm-split', verifyToken, confirmSplit);
router.post('/hubs/:category/subscribe', verifyToken, createHubSubscription);

// ── Campaign routes ───────────────────────────────
router.post('/campaigns', verifyToken, upload.single('bannerFile'), createCampaign);
router.get('/campaigns/highlights', optionalVerifyToken, getFundingHighlights);
router.get('/campaigns', optionalVerifyToken, getCampaigns);
router.patch('/campaigns/:id', verifyToken, updateCampaign);
router.delete('/campaigns/:id', verifyToken, deleteCampaign);
router.post('/campaigns/:id/donate-manual', verifyToken, donateManual);
router.put('/campaigns/:id/progress', verifyToken, updateCampaignProgress);

// ── Volunteering routes (General) ───────────────────────────────
router.post('/campaigns/volunteer', verifyToken, volunteerCampaign);
router.post('/campaigns/volunteer/cancel', verifyToken, cancelVolunteerCampaign);
router.get('/campaigns/volunteer/status', verifyToken, checkVolunteerStatus);

// ── Confirm volunteer via email (Public link click) ────────────
router.get('/campaigns/volunteer/confirm', confirmVolunteerCampaign);
router.get('/campaigns/volunteer/cancel-email', cancelVolunteerCampaignEmail);

// ── Mock Donation Checkout ──────────────────────────────────────
router.post('/campaigns/:id/donate-mock', verifyToken, mockDonateCampaign);

// ── Notify nearby volunteers ────────────────────────────────────
router.post('/campaigns/:id/notify', verifyToken, notifyNearbyVolunteers);

// ── Razorpay webhook (public, standard JSON body) ───────────────
router.post('/webhook', handleRazorpayWebhook);

module.exports = router;

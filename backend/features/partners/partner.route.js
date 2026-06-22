const express = require('express');
const router = express.Router();
const partnerController = require('./partner.controller');

// Get all public partners
router.get('/', partnerController.getAllPublicPartners);

// Get public partner profile
router.get('/:id/public', partnerController.getPublicPartnerProfile);

module.exports = router;

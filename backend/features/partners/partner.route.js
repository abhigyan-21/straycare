const express = require('express');
const router = express.Router();
const partnerController = require('./partner.controller');

// Get public partner profile
router.get('/:id/public', partnerController.getPublicPartnerProfile);

module.exports = router;

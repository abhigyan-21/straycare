const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { verifyToken, allowRoles } = require('../auth/auth.middleware');

// Token verification is required for all user routes
router.use(verifyToken);

router.post('/fcm-token', userController.saveFcmToken);
router.post('/rescuer-location', userController.updateRescuerLocation);

router.post('/upgrade-rescuer/request-otp', allowRoles('USER', 'VET', 'ADMIN', 'NGO'), userController.requestRescuerUpgradeOtp);
router.post('/upgrade-rescuer/verify-otp', allowRoles('USER', 'VET', 'ADMIN', 'NGO'), userController.verifyRescuerUpgradeOtp);
router.post('/leave-rescuer-role', allowRoles('RESCUER'), userController.leaveRescuerRole);

// Profile is accessible to all authenticated users
router.get('/profile', userController.getProfile);

// The routes below are restricted to Vet/Clinic/NGO staff or Admins
router.use(allowRoles('VET', 'ADMIN', 'NGO'));

router.get('/rescuers', userController.getClinicRescuers);
router.post('/rescuers/request-add-otp', userController.requestAddRescuerOtp);
router.post('/rescuers/add', userController.addRescuer);
router.post('/rescuers/remove/:id', userController.removeRescuer);

module.exports = router;

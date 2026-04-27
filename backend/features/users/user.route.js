const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { verifyToken, allowRoles } = require('../auth/auth.middleware');

// All routes here are protected and restricted to Vet/Clinic/NGO staff or Admins
router.use(verifyToken);
router.use(allowRoles('VET', 'ADMIN', 'NGO'));

router.get('/rescuers', userController.getClinicRescuers);
router.post('/rescuers/add', userController.addRescuer);
router.post('/rescuers/remove/:id', userController.removeRescuer);

module.exports = router;

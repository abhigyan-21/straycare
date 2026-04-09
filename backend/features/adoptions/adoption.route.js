const express = require('express');
const router = express.Router();
const adoptionController = require('./adoption.controller');
const { verifyToken, allowRoles } = require('../auth/auth.middleware');

// Public routes
router.get('/pets', adoptionController.listPets);
router.get('/pets/:id', adoptionController.getPetDetails);

// Protected routes
router.post('/pets', verifyToken, allowRoles('RESCUER', 'VET', 'ADMIN'), adoptionController.listPetForAdoption);
router.post('/requests', verifyToken, allowRoles('USER'), adoptionController.submitAdoptionRequest);
router.get('/requests', verifyToken, adoptionController.getAdoptionRequests);
router.patch('/requests/:id', verifyToken, allowRoles('RESCUER', 'VET', 'ADMIN'), adoptionController.updateRequestStatus);

module.exports = router;

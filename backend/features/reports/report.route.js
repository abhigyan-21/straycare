const express = require('express');
const router = express.Router();
const reportController = require('./report.controller');
const { verifyToken, allowRoles } = require('../auth/auth.middleware');

// Create a new report
router.post('/', verifyToken, reportController.createReport);

// Get my reports
router.get('/my-reports', verifyToken, reportController.getMyReports);

// Get rescues (reports assigned to this rescuer)
router.get('/my-rescues', verifyToken, allowRoles('RESCUER', 'ADMIN'), reportController.getMyRescues);

// Get clinic reports
router.get('/clinic', verifyToken, allowRoles('VET', 'ADMIN', 'NGO'), reportController.getClinicReports);

// Get all reports (restricted to staff for map view)
router.get('/', verifyToken, allowRoles('ADMIN', 'VET', 'RESCUER', 'NGO'), reportController.getReports);

// Get all verified clinics for routing
router.get('/clinics', verifyToken, reportController.getClinics);

// Get report by ID (public route so anyone with the link/ID can track)
router.get('/:id', reportController.getReportById);

// Update report status (restricted to staff)
router.patch('/:id/status', verifyToken, allowRoles('ADMIN', 'VET', 'RESCUER', 'NGO'), reportController.updateReportStatus);

// Assign a report
router.patch('/:id/assign', verifyToken, allowRoles('ADMIN', 'VET', 'NGO', 'RESCUER'), reportController.assignReport);

// Update rescuer location
router.patch('/:id/location', verifyToken, allowRoles('RESCUER'), reportController.updateRescuerLocation);

// Update rescue phase (heading to animal / heading to clinic)
router.patch('/:id/phase', verifyToken, allowRoles('RESCUER'), reportController.updateRescuePhase);

module.exports = router;
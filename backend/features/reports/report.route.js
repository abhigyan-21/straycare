const express = require('express');
const router = express.Router();
const reportController = require('./report.controller');
const { verifyToken, allowRoles } = require('../auth/auth.middleware');

// Create a new report
router.post('/', verifyToken, reportController.createReport);

// Get my reports
router.get('/my-reports', verifyToken, reportController.getMyReports);

// Get all reports (restricted to staff for map view)
router.get('/', verifyToken, allowRoles('ADMIN', 'VET', 'RESCUER'), reportController.getReports);

// Get report by ID (any authenticated user can track if they have the ID)
router.get('/:id', verifyToken, reportController.getReportById);

// Update report status (restricted to staff)
router.put('/:id/status', verifyToken, allowRoles('ADMIN', 'VET', 'RESCUER'), reportController.updateReportStatus);

module.exports = router;

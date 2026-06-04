const express = require('express');
const router = express.Router();
const medicalController = require('./medical.controller');
const documentController = require('./document.controller');
const { verifyToken, allowRoles } = require('../auth/auth.middleware');

// Create medical record (Professional staff only)
router.post('/', verifyToken, allowRoles('VET', 'ADMIN', 'NGO'), medicalController.createMedicalRecord);

// Get records by report ID (Staff only)
router.get('/report/:reportId', verifyToken, allowRoles('VET', 'ADMIN', 'RESCUER', 'NGO'), medicalController.getRecordsByReport);

// Update medical record (Professional staff only)
router.patch('/:id', verifyToken, allowRoles('VET', 'ADMIN', 'NGO'), medicalController.updateMedicalRecord);

// User pet documents routes
router.get('/documents', verifyToken, documentController.getUserDocuments);
router.post('/documents', verifyToken, documentController.uploadDocument);
router.delete('/documents/:id', verifyToken, documentController.deleteDocument);

module.exports = router;

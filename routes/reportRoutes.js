const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateJWT, authorizeRoles } = require('../middleware/authMiddleware');

// All report routes require authentication and admin/manager role
router.use(authenticateJWT, authorizeRoles('admin', 'manager'));

// JSON report
router.get('/', reportController.getReport);
// PDF report
router.get('/pdf', reportController.getReportPDF);
// Excel report
router.get('/excel', reportController.getReportExcel);

module.exports = router; 
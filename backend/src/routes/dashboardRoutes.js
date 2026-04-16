const express = require('express');
const { getWorkerDashboardData, getAdminDashboardData } = require('../controllers/dashboardController');
const { requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/worker', getWorkerDashboardData);
router.get('/admin', requireRole('ADMIN'), getAdminDashboardData);

module.exports = router;

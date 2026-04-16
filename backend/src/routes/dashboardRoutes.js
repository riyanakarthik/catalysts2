const express = require('express');
const { getWorkerDashboardData, getAdminDashboardData } = require('../controllers/dashboardController');

const router = express.Router();

router.get('/worker', getWorkerDashboardData);
router.get('/admin', getAdminDashboardData);

module.exports = router;

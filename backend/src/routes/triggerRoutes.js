const express = require('express');
const { simulateTrigger, fraudCheck } = require('../controllers/triggerController');
const { requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/simulate', requireRole('ADMIN'), simulateTrigger);
router.post('/fraud-check', requireRole('ADMIN'), fraudCheck);

module.exports = router;

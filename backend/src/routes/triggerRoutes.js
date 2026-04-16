const express = require('express');
const { simulateTrigger, fraudCheck } = require('../controllers/triggerController');

const router = express.Router();

router.post('/simulate', simulateTrigger);
router.post('/fraud-check', fraudCheck);

module.exports = router;

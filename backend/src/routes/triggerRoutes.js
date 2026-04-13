const express = require('express');
const { simulateTrigger } = require('../controllers/triggerController');

const router = express.Router();

router.post('/simulate', simulateTrigger);

module.exports = router;

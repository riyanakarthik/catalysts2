const express = require('express');
const { calculatePremium } = require('../controllers/premiumController');

const router = express.Router();

router.post('/calculate', calculatePremium);

module.exports = router;

const express = require('express');
const { getAllClaims, getClaimsByUser } = require('../controllers/claimController');

const router = express.Router();

router.get('/', getAllClaims);
router.get('/:userId', getClaimsByUser);

module.exports = router;

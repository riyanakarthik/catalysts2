const express = require('express');
const { getAllClaims, getClaimsByUser } = require('../controllers/claimController');
const { requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', requireRole('ADMIN'), getAllClaims);
router.get('/:userId', getClaimsByUser);

module.exports = router;

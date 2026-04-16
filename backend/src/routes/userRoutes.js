const express = require('express');
const { registerUser, getUsers, loginUser, deleteUser, verifyLocation } = require('../controllers/userController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/', requireAuth, requireRole('ADMIN'), getUsers);
router.delete("/me", requireAuth, deleteUser);
router.post('/verify-location', requireAuth, verifyLocation);

module.exports = router;

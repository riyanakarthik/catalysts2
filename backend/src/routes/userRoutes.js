const express = require('express');
const { registerUser, getUsers, loginUser, deleteUser, verifyLocation } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);  // 👈 ADD THIS
router.get('/', getUsers);
router.delete("/me", authMiddleware, deleteUser);
router.post('/verify-location', authMiddleware, verifyLocation);

module.exports = router;
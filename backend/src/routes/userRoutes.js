const express = require('express');
const router = express.Router();

const authController = require('../controllers/users');
const authMiddleware = require('../middlewares/auth');

// Register
router.post('/register', authController.createUser);

// Login
router.post('/login', authController.login);

// Current user from token
router.get('/me', authMiddleware, authController.me);

// Verify parent password
router.post('/verify-parent-password', authController.verifyParentPassword);

module.exports = router;

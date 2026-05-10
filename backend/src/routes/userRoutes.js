const express = require('express');
const router = express.Router();

const authController = require('../controllers/users');

// Register
router.post('/register', authController.createUser);

// Login
router.post('/login', authController.login);

// Verify parent password
router.post('/verify-parent-password', authController.verifyParentPassword);

module.exports = router;
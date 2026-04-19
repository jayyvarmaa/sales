const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('countryCode').notEmpty().withMessage('Country code is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, email, password, countryCode } = req.body;

    // Database connection check
    if (mongoose.connection.readyState === 0) {
        return res.status(503).json({ message: 'Database connecting... please refresh.' });
    }

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        user = await User.create({
            name,
            email,
            password,
            countryCode
        });

        req.session.userId = user._id;
        res.status(201).json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/login
// @desc    Login user & start session
// @access  Public
router.post('/login', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    // Database connection check
    if (mongoose.connection.readyState === 0) {
        return res.status(503).json({ message: 'Database connecting... please refresh.' });
    }

    try {
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!req.session) {
            console.error('Session middleware not initialized!');
            return res.status(500).json({ message: 'Session error. Check server configuration.' });
        }

        await logAudit(user._id, 'user_login', 'user', user._id);

        req.session.userId = user._id;
        res.json(user);
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ message: 'Internal server error during login' });
    }
});

// @route   POST /api/auth/logout
// @desc    Logout user & destroy session
// @access  Private
router.post('/logout', protect, (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Could not log out' });
        }
        res.clearCookie('connect.sid'); // Default session cookie name
        res.json({ message: 'Logged out successfully' });
    });
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
    res.json(req.user);
});

module.exports = router;

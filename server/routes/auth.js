const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

const router = express.Router();

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Hardcoded Users for Production/Demo
const USERS = [
    {
        _id: '1',
        name: 'Admin User',
        email: 'admin@sales.com',
        password: 'password', // In real app, this would be hashed
        role: 'manager',
        countryCode: 'US',
        avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=random',
        managerId: null
    },
    {
        _id: '2',
        name: 'Sales Rep',
        email: 'user@sales.com',
        password: 'password',
        role: 'rep',
        countryCode: 'US',
        avatar: 'https://ui-avatars.com/api/?name=Sales+Rep&background=random',
        managerId: '1'
    }
];

// @route   POST /api/auth/register
// @desc    Register a new user (DISABLED)
// @access  Public
router.post('/register', (req, res) => {
    res.status(403).json({ message: 'Registration is disabled in this demo version. Please use the provided credentials.' });
});

// @route   POST /api/auth/login
// @desc    Login user & return token
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

    // Hardcoded check
    const user = USERS.find(u => u.email === email && u.password === password);

    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials. Try admin@sales.com / password' });
    }

    try {
        await logAudit(user._id, 'user_login', 'user', user._id);

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            ...userWithoutPassword,
            token: generateToken(user._id)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        // req.user is already set by protect middleware
        if (!req.user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(req.user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

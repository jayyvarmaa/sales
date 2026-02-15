const express = require('express');
const User = require('../models/User');
const Lead = require('../models/Lead');
const { protect, authorize } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

const router = express.Router();

// @route   GET /api/users
// @desc    List users (scoped by role)
// @access  Manager, Master
router.get('/', protect, authorize('manager', 'master'), async (req, res) => {
    try {
        let filter = {};
        if (req.user.role === 'manager') {
            filter.countryCode = req.user.countryCode;
        }

        const { role, country } = req.query;
        if (role) filter.role = role;
        if (country) filter.countryCode = country.toUpperCase();

        const users = await User.find(filter)
            .populate('managerId', 'name email')
            .sort({ createdAt: -1 });

        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/users/stats
// @desc    User statistics
// @access  Manager, Master
router.get('/stats', protect, authorize('manager', 'master'), async (req, res) => {
    try {
        let matchFilter = {};
        if (req.user.role === 'manager') {
            matchFilter.countryCode = req.user.countryCode;
        }

        const totalUsers = await User.countDocuments(matchFilter);
        const byRole = await User.aggregate([
            { $match: matchFilter },
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);
        const byCountry = await User.aggregate([
            { $match: matchFilter },
            { $group: { _id: '$countryCode', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.json({ totalUsers, byRole, byCountry });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/users/:id
// @desc    Get user profile
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('managerId', 'name email');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get user's lead count
        const leadCount = await Lead.countDocuments({ createdBy: user._id });

        res.json({ ...user.toJSON(), leadCount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/users/:id/role
// @desc    Change user role (promote/demote)
// @access  Master only
router.put('/:id/role', protect, authorize('master'), async (req, res) => {
    try {
        const { role } = req.body;
        if (!['rep', 'manager', 'master'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const oldRole = user.role;
        user.role = role;

        // If promoted to manager, clear managerId
        if (role === 'manager' || role === 'master') {
            user.managerId = null;
        }

        await user.save();
        await logAudit(req.user._id, 'role_changed', 'user', user._id, {
            from: oldRole,
            to: role,
            userName: user.name
        });

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private (Owner or Master)
router.put('/:id', protect, async (req, res) => {
    try {
        // Allow if user is updating self OR user is master
        if (req.user._id.toString() !== req.params.id && req.user.role !== 'master') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { name, email, password } = req.body;
        if (name) user.name = name;
        if (email) user.email = email;
        if (password) user.password = password; // Will be hashed by pre-save hook

        await user.save();
        await logAudit(req.user._id, 'user_updated', 'user', user._id, {
            updatedFields: { name: !!name, email: !!email, password: !!password }
        });

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

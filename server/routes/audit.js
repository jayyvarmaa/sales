const express = require('express');
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/audit
// @desc    Get audit logs (paginated)
// @access  Master only
router.get('/', protect, authorize('master'), async (req, res) => {
    try {
        const { page = 1, limit = 30, action, userId } = req.query;
        const filter = {};

        if (action) filter.action = action;
        if (userId) filter.userId = userId;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [logs, total] = await Promise.all([
            AuditLog.find(filter)
                .populate('userId', 'name email avatar role')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            AuditLog.countDocuments(filter)
        ]);

        res.json({
            logs,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit))
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/audit/feed
// @desc    Get activity feed for dashboard
// @access  Private
router.get('/feed', protect, async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        let filter = {};

        // Role-based filtering
        if (req.user.role === 'manager') {
            // Managers see activity of users in their country
            const subordinates = await require('../models/User').find({ countryCode: req.user.countryCode }).select('_id');
            const subordinateIds = subordinates.map(u => u._id);
            filter.userId = { $in: subordinateIds };
        } else if (req.user.role === 'rep') {
            // Reps see their own activity + activity on their leads
            const myLeads = await require('../models/Lead').find({ createdBy: req.user._id }).select('_id');
            const myLeadIds = myLeads.map(l => l._id);

            filter = {
                $or: [
                    { userId: req.user._id },
                    { targetId: { $in: myLeadIds } }
                ]
            };
        }
        // Master sees all

        const logs = await AuditLog.find(filter)
            .populate('userId', 'name email avatar role')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json(logs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

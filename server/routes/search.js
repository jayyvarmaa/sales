const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Lead = require('../models/Lead');
const User = require('../models/User');

// @route   GET /api/search
// @desc    Search leads and users
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.json({ leads: [], users: [] });
        }

        const regex = new RegExp(q, 'i');

        // --- Search Leads ---
        let leadQuery = {
            $or: [
                { title: regex },
                { companyName: regex },
                { description: regex },
                { tags: regex }
            ]
        };

        // Role-based access control for leads
        if (req.user.role === 'rep') {
            leadQuery.createdBy = req.user._id;
        } else if (req.user.role === 'manager') {
            leadQuery.countryCode = req.user.countryCode;
        }
        // Master sees all (no extra filter)

        const leads = await Lead.find(leadQuery)
            .limit(5)
            .populate('createdBy', 'name avatar')
            .sort({ createdAt: -1 });

        // --- Search Users ---
        // (Visible to everyone for collaboration)
        const users = await User.find({
            $or: [
                { name: regex },
                { email: regex }
            ]
        })
            .limit(5)
            .select('name email avatar role countryCode');

        res.json({ leads, users });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;

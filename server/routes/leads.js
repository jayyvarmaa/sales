const express = require('express');
const { body, validationResult } = require('express-validator');
const Lead = require('../models/Lead');
const User = require('../models/User'); // Added for notifications
const { protect, authorize } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');
const { createNotification } = require('../utils/notifications');

const router = express.Router();

// @route   POST /api/leads
// @desc    Create a new lead
// @access  Rep
router.post('/', protect, authorize('rep'), [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
        const { title, description, companyName, contactEmail, estimatedValue, tags } = req.body;

        const lead = await Lead.create({
            title,
            description,
            companyName: companyName || '',
            contactEmail: contactEmail || '',
            estimatedValue: estimatedValue || 0,
            countryCode: req.user.countryCode,
            tags: tags || [],
            status: 'open',
            createdBy: req.user._id
        });

        await logAudit(req.user._id, 'lead_created', 'lead', lead._id, { title });

        const populated = await Lead.findById(lead._id).populate('createdBy', 'name email avatar role countryCode');
        res.status(201).json(populated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/leads
// @desc    List leads (role-scoped)
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { status, country, page = 1, limit = 20 } = req.query;
        let filter = {};

        // Role-based filtering
        if (req.user.role === 'rep') {
            filter.createdBy = req.user._id;
        } else if (req.user.role === 'manager') {
            filter.countryCode = req.user.countryCode;
        }
        // master sees all

        if (status) {
            filter.status = status;
        } else {
            filter.status = { $ne: 'archived' };
        }
        if (country) filter.countryCode = country.toUpperCase();

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [leads, total] = await Promise.all([
            Lead.find(filter)
                .populate('createdBy', 'name email avatar role countryCode')
                .populate('reviewedBy', 'name email avatar')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Lead.countDocuments(filter)
        ]);

        res.json({
            leads,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit))
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/leads/stats
// @desc    Get lead statistics
// @access  Manager, Master
router.get('/stats', protect, authorize('manager', 'master'), async (req, res) => {
    try {
        let matchFilter = {};
        if (req.user.role === 'manager') {
            matchFilter.countryCode = req.user.countryCode;
        }

        const stats = await Lead.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalValue: { $sum: '$estimatedValue' }
                }
            }
        ]);

        const byCountry = await Lead.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: '$countryCode',
                    count: { $sum: 1 },
                    totalValue: { $sum: '$estimatedValue' },
                    approved: {
                        $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
                    }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Activity data for contribution graph (last 12 weeks)
        const twelveWeeksAgo = new Date();
        twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

        const activity = await Lead.aggregate([
            { $match: { ...matchFilter, createdAt: { $gte: twelveWeeksAgo } } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const statusMap = {};
        let totalLeads = 0;
        let totalValue = 0;

        stats.forEach(s => {
            statusMap[s._id] = { count: s.count, totalValue: s.totalValue };
            totalLeads += s.count;
            totalValue += s.totalValue;
        });

        res.json({
            totalLeads,
            totalValue,
            byStatus: statusMap,
            byCountry,
            activity
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/leads/analytics
// @desc    Get lead analytics
// @access  Manager/Master
router.get('/analytics', protect, authorize('manager', 'master'), async (req, res) => {
    try {
        const totalLeads = await Lead.countDocuments();
        const leadsByStatus = await Lead.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$estimatedValue' } } }
        ]);

        // Pipeline Value (Open + Pending)
        const pipelineValue = leadsByStatus
            .filter(s => ['open', 'pending_review'].includes(s._id))
            .reduce((acc, curr) => acc + (curr.value || 0), 0);

        // Win Rate
        const approved = leadsByStatus.find(s => s._id === 'approved')?.count || 0;
        const denied = leadsByStatus.find(s => s._id === 'denied')?.count || 0;
        const totalProcessed = approved + denied;
        const winRate = totalProcessed > 0 ? ((approved / totalProcessed) * 100).toFixed(1) : 0;

        // Recent Activity (Last 5 leads)
        const recentLeads = await Lead.find().sort({ createdAt: -1 }).limit(5).populate('createdBy', 'name');

        // Leads by User (Top 5)
        const leadsByUser = await Lead.aggregate([
            { $group: { _id: '$createdBy', count: { $sum: 1 }, value: { $sum: '$estimatedValue' } } },
            { $sort: { value: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' },
            { $project: { name: '$user.name', count: 1, value: 1 } }
        ]);

        res.json({
            totalLeads,
            leadsByStatus,
            pipelineValue,
            winRate,
            recentLeads,
            leadsByUser
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/leads/bulk-update
// @desc    Bulk update leads (approve, deny, archive)
// @access  Manager, Master
router.put('/bulk-update', protect, authorize('manager', 'master'), [
    body('ids').isArray({ min: 1 }).withMessage('IDs must be a non-empty array'),
    body('action').isIn(['approved', 'denied', 'archived']).withMessage('Invalid action')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
        const { ids, action, comment } = req.body;
        let filter = { _id: { $in: ids } };

        // Manager restriction: only leads in their country
        if (req.user.role === 'manager') {
            filter.countryCode = req.user.countryCode;
        }

        // Additional validation based on action
        if (action === 'approved' || action === 'denied') {
            filter.status = { $in: ['open', 'pending_review'] };
        }

        const updates = {
            status: action
        };

        if (action === 'approved' || action === 'denied') {
            updates.reviewedBy = req.user._id;
            updates.reviewedAt = new Date();
            updates.reviewComment = comment || 'Bulk action';
        }

        const result = await Lead.updateMany(filter, updates);

        // Audit Log (Bulk)
        await logAudit(req.user._id, `bulk_${action}`, 'system', null, {
            count: result.modifiedCount,
            ids: ids
        });

        res.json({ message: `Scucessfully updated ${result.modifiedCount} leads`, modifiedCount: result.modifiedCount });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/leads/:id
// @desc    Get single lead with comments
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id)
            .populate('createdBy', 'name email avatar role countryCode')
            .populate('reviewedBy', 'name email avatar role')
            .populate('comments.user', 'name email avatar role');

        if (!lead) {
            return res.status(404).json({ message: 'Lead not found' });
        }

        // Access check
        if (req.user.role === 'rep' && lead.createdBy._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this lead' });
        }
        if (req.user.role === 'manager' && lead.countryCode !== req.user.countryCode) {
            return res.status(403).json({ message: 'Not authorized to view leads outside your region' });
        }

        res.json(lead);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/leads/:id
// @desc    Update lead details
// @access  Rep (owner)
router.put('/:id', protect, authorize('rep'), async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (!lead) {
            return res.status(404).json({ message: 'Lead not found' });
        }
        if (lead.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to edit this lead' });
        }
        if (lead.status === 'approved' || lead.status === 'denied') {
            return res.status(400).json({ message: 'Cannot edit a reviewed lead' });
        }

        const { title, description, companyName, contactEmail, estimatedValue, tags } = req.body;
        if (title) lead.title = title;
        if (description) lead.description = description;
        if (companyName !== undefined) lead.companyName = companyName;
        if (contactEmail !== undefined) lead.contactEmail = contactEmail;
        if (estimatedValue !== undefined) lead.estimatedValue = estimatedValue;
        if (tags) lead.tags = tags;

        // If editing a pending lead, revert to open so it must be submitted again
        if (lead.status === 'pending_review') {
            lead.status = 'open';
        }

        await lead.save();
        await logAudit(req.user._id, 'lead_updated', 'lead', lead._id, { title: lead.title });

        const populated = await Lead.findById(lead._id)
            .populate('createdBy', 'name email avatar role countryCode');
        res.json(populated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/leads/:id/submit
// @desc    Submit lead for review
// @access  Rep (owner)
router.put('/:id/submit', protect, authorize('rep'), async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (!lead) return res.status(404).json({ message: 'Lead not found' });
        if (lead.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        if (lead.status !== 'open') {
            return res.status(400).json({ message: 'Lead is not in open state' });
        }

        lead.status = 'pending_review';
        await lead.save();
        await logAudit(req.user._id, 'lead_submitted', 'lead', lead._id, { title: lead.title });

        // Notify Managers of the same country
        const managers = await User.find({ role: 'manager', countryCode: lead.countryCode }).select('_id');
        const managerIds = managers.map(m => m._id);

        await createNotification(req, {
            users: managerIds,
            type: 'info',
            message: `New lead pending review: ${lead.title}`,
            link: `/leads/${lead._id}`
        });

        res.json(lead);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/leads/:id/review
// @desc    Approve or deny a lead
// @access  Manager, Master
router.put('/:id/review', protect, authorize('manager', 'master'), [
    body('action').isIn(['approved', 'denied']).withMessage('Action must be "approved" or "denied"')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
        const lead = await Lead.findById(req.params.id);
        if (!lead) return res.status(404).json({ message: 'Lead not found' });

        // Manager can only review leads in their country
        if (req.user.role === 'manager' && lead.countryCode !== req.user.countryCode) {
            return res.status(403).json({ message: 'Not authorized to review leads outside your region' });
        }

        if (lead.status !== 'pending_review' && lead.status !== 'open') {
            return res.status(400).json({ message: 'Lead is not available for review' });
        }

        const { action, comment } = req.body;
        lead.status = action;
        lead.reviewedBy = req.user._id;
        lead.reviewComment = comment || '';
        lead.reviewedAt = new Date();

        // Add a review comment to the thread
        if (comment) {
            lead.comments.push({
                user: req.user._id,
                body: `**${action === 'approved' ? '✅ Approved' : '❌ Denied'}**: ${comment}`
            });
        }

        await lead.save();
        await logAudit(req.user._id, `lead_${action}`, 'lead', lead._id, {
            title: lead.title,
            comment
        });

        // Notify Lead Owner
        await createNotification(req, {
            users: [lead.createdBy],
            type: action === 'approved' ? 'success' : 'error',
            message: `Your lead "${lead.title}" has been ${action}`,
            link: `/leads/${lead._id}`
        });

        const populated = await Lead.findById(lead._id)
            .populate('createdBy', 'name email avatar role countryCode')
            .populate('reviewedBy', 'name email avatar role')
            .populate('comments.user', 'name email avatar role');

        res.json(populated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/leads/:id/comments
// @desc    Add a comment to a lead
// @access  Private
router.post('/:id/comments', protect, [
    body('body').trim().notEmpty().withMessage('Comment body is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
        const lead = await Lead.findById(req.params.id);
        if (!lead) return res.status(404).json({ message: 'Lead not found' });

        lead.comments.push({
            user: req.user._id,
            body: req.body.body
        });

        await lead.save();
        await logAudit(req.user._id, 'comment_added', 'lead', lead._id, { title: lead.title });

        const populated = await Lead.findById(lead._id)
            .populate('createdBy', 'name email avatar role countryCode')
            .populate('reviewedBy', 'name email avatar role')
            .populate('comments.user', 'name email avatar role');

        res.json(populated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/leads/:id
// @desc    Soft delete a lead (archive)
// @access  Rep (owner)
router.delete('/:id', protect, authorize('rep'), async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (!lead) return res.status(404).json({ message: 'Lead not found' });

        if (lead.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this lead' });
        }

        // Only allow deleting if not yet approved/denied (or allow it but log it?)
        // Let's allow deleting open/pending leads.
        if (lead.status === 'approved' || lead.status === 'denied') {
            return res.status(400).json({ message: 'Cannot delete a processed lead. Ask a manager to archive it.' });
        }

        lead.status = 'archived'; // Soft delete
        await lead.save();
        await logAudit(req.user._id, 'lead_deleted', 'lead', lead._id, { title: lead.title });

        res.json({ message: 'Lead removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

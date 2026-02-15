const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    body: {
        type: String,
        required: true,
        maxlength: 2000
    }
}, {
    timestamps: true
});

const leadSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Lead title is required'],
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        maxlength: 5000
    },
    companyName: {
        type: String,
        trim: true,
        maxlength: 200,
        default: ''
    },
    contactEmail: {
        type: String,
        trim: true,
        lowercase: true,
        default: ''
    },
    estimatedValue: {
        type: Number,
        default: 0,
        min: 0
    },
    countryCode: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    status: {
        type: String,
        enum: ['open', 'pending_review', 'approved', 'denied', 'closed'],
        default: 'open'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    reviewComment: {
        type: String,
        default: ''
    },
    reviewedAt: {
        type: Date,
        default: null
    },
    comments: [commentSchema]
}, {
    timestamps: true
});

// Indexes for fast queries
leadSchema.index({ countryCode: 1, status: 1 });
leadSchema.index({ createdBy: 1 });
leadSchema.index({ status: 1 });

module.exports = mongoose.model('Lead', leadSchema);

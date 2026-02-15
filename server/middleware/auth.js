const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Hardcoded Users (Must match auth routes)
const USERS = [
    {
        _id: '1',
        name: 'Admin User',
        email: 'admin@sales.com',
        role: 'manager',
        countryCode: 'US',
        managerId: null
    },
    {
        _id: '2',
        name: 'Sales Rep',
        email: 'user@sales.com',
        role: 'rep',
        countryCode: 'US',
        managerId: '1'
    }
];

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized — no token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user from hardcoded list
        req.user = USERS.find(u => u._id === decoded.id);

        if (!req.user) {
            return res.status(401).json({ message: 'User no longer exists' });
        }
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Not authorized — invalid token' });
    }
};

// Role-based access control
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Role '${req.user.role}' is not authorized to access this resource`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };

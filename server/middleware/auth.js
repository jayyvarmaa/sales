const User = require('../models/User');

// Protect routes - verify session
const protect = async (req, res, next) => {
    if (req.session && req.session.userId) {
        try {
            const user = await User.findById(req.session.userId);
            if (!user) {
                return res.status(401).json({ message: 'User no longer exists' });
            }
            req.user = user;
            return next();
        } catch (err) {
            console.error('Auth Middleware Error:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    return res.status(401).json({ message: 'Not authorized — please log in' });
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

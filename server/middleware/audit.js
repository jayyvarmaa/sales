const AuditLog = require('../models/AuditLog');

const logAudit = async (userId, action, targetType, targetId = null, details = {}) => {
    try {
        await AuditLog.create({
            userId,
            action,
            targetType,
            targetId,
            details
        });
    } catch (err) {
        console.error('Audit log error:', err.message);
    }
};

module.exports = { logAudit };

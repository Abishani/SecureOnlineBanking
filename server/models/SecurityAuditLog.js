const mongoose = require('mongoose');

const securityAuditLogSchema = new mongoose.Schema({
    event: {
        type: String,
        required: true, // "LOGIN_SUCCESS", "LOGIN_FAIL", "PASSWORD_CHANGE", "MFA_SETUP"
    },
    actor: {
        userId: mongoose.Schema.Types.ObjectId,
        email: String,
        ip: String,
    },
    severity: {
        type: String,
        enum: ['INFO', 'WARNING', 'ERROR', 'CRITICAL'],
        default: 'INFO'
    },
    details: mongoose.Schema.Types.Mixed,
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('SecurityAuditLog', securityAuditLogSchema);

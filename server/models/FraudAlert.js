const mongoose = require('mongoose');

const fraudAlertSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    alertType: {
        type: String, 
        enum: ['MULTIPLE_FAILED_LOGINS', 'IMPOSSIBLE_TRAVEL', 'LOGIN_WARNING', 'LOGIN_FLAG', 'LOGIN_BLOCK', 'MULTIPLE_IPS', 'UNUSUAL_LOCATION', 'UNUSUAL_TIME', 'DEVICE_MISMATCH', 'MULTIPLE_LOCKOUTS'],
        required: true
    },
    severity: {
        type: String,
        enum: ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'MEDIUM'
    },
    triggeredRules: [String],
    riskScore: Number,
    ipAddress: String,
    geolocation: String,
    details: mongoose.Schema.Types.Mixed,
    status: {
        type: String,
        enum: ['PENDING', 'REVIEWED', 'DISMISSED', 'CONFIRMED'],
        default: 'PENDING'
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('FraudAlert', fraudAlertSchema);

const mongoose = require('mongoose');

const fraudAlertSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    alertType: {
        type: String, // e.g., "MULTIPLE_FAILED_LOGINS", "IMPOSSIBLE_TRAVEL"
        required: true,
    },
    severity: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'MEDIUM'
    },
    triggeredRules: [String], // List of rule IDs/Names
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

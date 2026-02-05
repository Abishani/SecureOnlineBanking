const mongoose = require('mongoose');

const loginAttemptSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false, // May be unknown user
    },
    email: {
        type: String,
        required: true,
    },
    ipAddress: {
        type: String,
        required: true,
    },
    userAgent: String,
    geolocation: {
        city: String,
        country: String,
        lat: Number,
        lon: Number
    },
    success: {
        type: Boolean,
        required: true,
    },
    failReason: String, // "Wrong Password", "MFA Failed", "Fraud Block"
    riskScore: Number,
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('LoginAttempt', loginAttemptSchema);

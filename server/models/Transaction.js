const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    recipient: {
        type: String, // Account number or email
        required: true,
    },
    currency: {
        type: String,
        default: 'USD'
    },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED', 'BLOCKED'],
        default: 'COMPLETED'
    },
    ipAddress: String,
    geolocation: String,
    fraudCheck: {
        passed: Boolean,
        riskScore: Number,
        flags: [String]
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Transaction', transactionSchema);

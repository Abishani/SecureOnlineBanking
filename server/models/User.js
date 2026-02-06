const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { encrypt, decrypt } = require('../utils/encryption');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    mfaSecretEncrypted: {
        type: String, // Encrypted Base32 secret for TOTP
    },
    mfaEnabled: {
        type: Boolean,
        default: false,
    },
    mfaFailedAttempts: {
        type: Number,
        default: 0,
    },
    mfaLockedUntil: {
        type: Date,
    },
    // Security Tracking
    lastLoginIP: String,
    lastLoginTime: Date,
    loginAttempts: {
        type: Number,
        default: 0,
    },
    lockUntil: {
        type: Date,
    },
    knownIPs: [String],
    knownDevices: [String], // User-Agent or Fingerprint hashes
    usualGeolocations: [String], // "City, Country"
    averageTransactionAmount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Virtual field for mfaSecret (automatic encryption/decryption)
userSchema.virtual('mfaSecret')
    .get(function () {
        if (!this.mfaSecretEncrypted) return null;
        try {
            return decrypt(this.mfaSecretEncrypted);
        } catch (err) {
            console.error('MFA Secret decryption failed:', err);
            return null;
        }
    })
    .set(function (value) {
        if (value) {
            this.mfaSecretEncrypted = encrypt(value);
        } else {
            this.mfaSecretEncrypted = null;
        }
    });

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

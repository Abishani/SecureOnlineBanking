const express = require('express');
const router = express.Router();
const User = require('../models/User');
const LoginAttempt = require('../models/LoginAttempt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const FraudEngine = require('../fraud/FraudEngine');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const user = await User.create({ email, password });
        res.status(201).json({
            _id: user._id,
            email: user.email,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    try {
        const user = await User.findOne({ email });

        // 1. Password Check
        if (!user || !(await user.matchPassword(password))) {
            // Log Failure
            await LoginAttempt.create({
                email, userId: user ? user._id : null, ipAddress: ip, success: false, failReason: 'WRONG_PASSWORD'
            });

            // Check Fraud/Risk on Failure (Rule 1)
            const fraudResult = await FraudEngine.evaluateLogin({ email, userId: user ? user._id : null, ip: ip, userAgent });

            if (fraudResult.action === 'BLOCK') {
                return res.status(403).json({ message: 'Account blocked due to multiple failed logins', risk: fraudResult });
            }

            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // 2. Fraud Check (Pre-Login)
        const fraudResult = await FraudEngine.evaluateLogin({ email, userId: user._id, ip: ip, userAgent });

        // Log Attempt
        await LoginAttempt.create({
            email, userId: user._id, ipAddress: ip, success: true, riskScore: fraudResult.riskScore, userAgent
        });

        if (fraudResult.action === 'BLOCK') {
            return res.status(403).json({ message: 'Account blocked due to suspicious activity', risk: fraudResult });
        }

        // 3. Return Token
        res.json({
            _id: user._id,
            email: user.email,
            token: generateToken(user._id),
            riskAnalysis: fraudResult
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/mfa/setup
router.post('/mfa/setup', async (req, res) => {
    const { userId } = req.body; // In real app, get from req.user
    try {
        const secret = speakeasy.generateSecret({ name: "SecureBankApp" });
        const user = await User.findById(userId);
        user.mfaSecret = secret.base32;
        await user.save();

        QRCode.toDataURL(secret.otpauth_url, (err, data_url) => {
            res.json({ secret: secret.base32, qrCode: data_url });
        });
    } catch (error) {
        res.status(500).json({ message: 'Error generating MFA' });
    }
});

// @route   POST /api/auth/mfa/verify
router.post('/mfa/verify', async (req, res) => {
    const { userId, token } = req.body;
    try {
        const user = await User.findById(userId);
        const verified = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token: token
        });

        if (verified) {
            user.mfaEnabled = true;
            await user.save();
            res.json({ success: true, message: 'MFA Verified & Enabled' });
        } else {
            res.status(400).json({ success: false, message: 'Invalid Token' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error verifying MFA' });
    }
});

module.exports = router;

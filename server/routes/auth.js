const express = require('express');
const router = express.Router();
console.log("!!! AUTH ROUTE LOADED - VERSION WITH RECOVERY CODES !!!");
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const validator = require('validator');
const User = require('../models/User');
const LoginAttempt = require('../models/LoginAttempt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const FraudEngine = require('../fraud/FraudEngine');
const { protect } = require('../middleware/auth');

// Helper: Hash Recovery Code
const hashCode = (code) => crypto.createHash('sha256').update(code).digest('hex');

// Validate JWT_SECRET on startup
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 20) {
    console.error('FATAL: JWT_SECRET must be set and at least 20 characters');
    process.exit(1);
}

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// Rate Limiters
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Increased from 100 to 1000 to prevent locking out valid users during testing/demo
    message: { message: 'Too many attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip if it's a mock request from localhost (optional, but good for testing)
    skip: (req) => req.ip === '::1' || req.ip === '127.0.0.1'
});

const mfaLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // More attempts for MFA as codes expire quickly
    message: { message: 'Too many MFA attempts, please try again later' },
});

// @route   POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
    const { email, password } = req.body;

    try {
        // Input validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // Strong password requirements
        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
        }

        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            return res.status(400).json({ message: 'Password must contain uppercase, lowercase, and number' });
        }

        // Sanitize email
        const sanitizedEmail = validator.normalizeEmail(email);

        const userExists = await User.findOne({ email: sanitizedEmail });
        if (userExists) {
            return res.status(400).json({ message: 'Registration failed' }); // Generic message
        }

        const user = await User.create({ email: sanitizedEmail, password });
        res.status(201).json({
            _id: user._id,
            email: user.email,
            token: generateToken(user._id),
            role: user.role,
            mfaEnabled: false, // Default for new users
            riskAnalysis: { // Default safe risk analysis for initial registration
                riskScore: 0,
                action: 'ALLOW',
                triggeredRules: []
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Registration failed' });
    }
});

// @route   POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
    const { email, password, mockIp, mockCountry, mockUserAgent } = req.body;

    // Input validation
    if (!email || !password) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!validator.isEmail(email)) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Sanitize
    const sanitizedEmail = validator.normalizeEmail(email);

    // Allow Mock Overrides for Manual Testing (Demo Mode)
    const ip = mockIp || req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = mockUserAgent || req.headers['user-agent'];

    try {
        const user = await User.findOne({ email: sanitizedEmail });

        // 1. Password Check - Use consistent error message
        if (!user || !(await user.matchPassword(password))) {
            // Log Failure
            await LoginAttempt.create({
                email: sanitizedEmail,
                userId: user ? user._id : null,
                ipAddress: ip,
                success: false,
                failReason: 'WRONG_PASSWORD'
            });

            // Check Fraud/Risk on Failure (Rule 1)
            const fraudResult = await FraudEngine.evaluateLogin({
                email: sanitizedEmail,
                userId: user ? user._id : null,
                ip: ip,
                userAgent
            });

            if (fraudResult.action === 'BLOCK') {
                // Log the Lockout event so Rule 11 can find it later
                await LoginAttempt.create({
                    email: sanitizedEmail,
                    userId: user ? user._id : null,
                    ipAddress: ip,
                    success: false,
                    failReason: 'ACCOUNT_LOCKED'
                });

                return res.status(403).json({ message: 'Account temporarily locked', risk: fraudResult });
            }

            // Generic error message to prevent user enumeration
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 2. Fraud Check (Pre-Login)
        const country = mockCountry || req.headers['x-mock-country'];
        const fraudResult = await FraudEngine.evaluateLogin({
            email: sanitizedEmail,
            userId: user._id,
            ip: ip,
            userAgent,
            mockCountry: country
        });

        if (fraudResult.action === 'BLOCK') {
            await LoginAttempt.create({
                email: sanitizedEmail,
                userId: user._id,
                ipAddress: ip,
                success: false, // Corrected: fraud block is not a successful login
                riskScore: fraudResult.riskScore,
                userAgent,
                failReason: 'FRAUD_BLOCK'
            });
            return res.status(403).json({ message: 'Account temporarily locked', risk: fraudResult });
        }

        // 3. MFA Check
        if (user.mfaEnabled) {
            // Don't log as successful yet, wait for MFA
            return res.json({
                success: false,
                mfaRequired: true,
                userId: user._id, // Will be removed in next iteration with session-based approach
                message: 'MFA Verification Required'
            });
        }

        // 4. Log Successful Login (No MFA)
        await LoginAttempt.create({
            email: sanitizedEmail,
            userId: user._id,
            ipAddress: ip,
            success: true,
            riskScore: fraudResult.riskScore,
            userAgent
        });

        //5. Return Token (Standard Login)
        res.json({
            _id: user._id,
            email: user.email,
            token: generateToken(user._id),
            riskAnalysis: fraudResult
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed' });
    }
});

// @route   POST /api/auth/mfa/setup
router.post('/mfa/setup', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const secret = speakeasy.generateSecret({ name: "SecureBankApp" });
        user.mfaSecret = secret.base32; // Will be automatically encrypted by virtual

        // Generate Recovery Codes (5 codes, 10 chars each)
        const recoveryCodesPlain = [];
        const recoveryCodesHashed = [];

        for (let i = 0; i < 5; i++) {
            const code = crypto.randomBytes(5).toString('hex').toUpperCase(); // 10 chars
            recoveryCodesPlain.push(code);
            recoveryCodesHashed.push({ code: hashCode(code), used: false });
        }

        user.recoveryCodes = recoveryCodesHashed;
        await user.save();

        console.error("DEBUG: Generated Recovery Codes (Plain):", recoveryCodesPlain);

        QRCode.toDataURL(secret.otpauth_url, (err, data_url) => {
            if (err) {
                console.error("MFA Setup: QR Code generation error", err);
                return res.status(500).json({ message: 'QR Generation Error' });
            }
            console.error("DEBUG: Sending MFA Setup Response with codes:", recoveryCodesPlain.length);
            res.json({
                secret: secret.base32,
                qrCode: data_url,
                recoveryCodes: recoveryCodesPlain,
                codes: recoveryCodesPlain
            });
        });
    } catch (error) {
        console.error("MFA Setup Error:", error);
        res.status(500).json({ message: 'MFA setup failed' });
    }
});

// @route   POST /api/auth/mfa/verify
router.post('/mfa/verify', mfaLimiter, async (req, res) => {
    const { userId, token } = req.body;

    try {
        // Input validation
        if (!userId || !token) {
            return res.status(400).json({ message: 'User ID and token required' });
        }

        // Sanitize token (remove spaces/dashes)
        const cleanToken = token.replace(/\s+|-/g, '');

        if (!/^(\d{6}|[A-Fa-f0-9]{10})$/.test(cleanToken)) {
            return res.status(400).json({ success: false, message: 'Invalid token format' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if MFA is locked
        if (user.mfaLockedUntil && user.mfaLockedUntil > new Date()) {
            return res.status(403).json({
                success: false,
                message: 'Too many failed attempts. Try again later.'
            });
        }

        const verified = speakeasy.totp.verify({
            secret: user.mfaSecret, // Will be automatically decrypted by virtual
            encoding: 'base32',
            token: cleanToken,
            window: 2 // Allow 2 steps (60s) before/after for clock drift/slow typing
        });

        // Check Recovery Code if TOTP fails or if token format looks like recovery code (10 chars)
        let recoveryUsed = false;
        let isSuccess = verified;

        if (!verified && cleanToken.length === 10) {
            const hashedInput = hashCode(cleanToken);
            const codeIndex = user.recoveryCodes.findIndex(rc => rc.code === hashedInput && !rc.used);

            if (codeIndex !== -1) {
                isSuccess = true;
                user.recoveryCodes[codeIndex].used = true;
                recoveryUsed = true;
            }
        }

        if (isSuccess) {
            // Reset failed attempts
            user.mfaFailedAttempts = 0;
            user.mfaLockedUntil = null;

            // Enable MFA if this was the setup phase
            if (!user.mfaEnabled) {
                user.mfaEnabled = true;
                await user.save();
                return res.json({
                    success: true,
                    message: 'MFA Verified & Enabled',
                    user: {
                        _id: user._id,
                        email: user.email,
                        role: user.role,
                        mfaEnabled: true
                    }
                });
            }

            await user.save();

            // Normal MFA Login Verification -> Issue Token
            // Re-check fraud (in case IP changed between steps)
            const ip = req.ip || req.headers['x-forwarded-for'];
            const userAgent = req.headers['user-agent'];

            const fraudResult = await FraudEngine.evaluateLogin({
                email: user.email,
                userId: user._id,
                ip,
                userAgent
            });

            if (fraudResult.action === 'BLOCK') {
                return res.status(403).json({
                    success: false,
                    message: 'Account temporarily locked'
                });
            }

            // Log successful MFA login
            await LoginAttempt.create({
                email: user.email,
                userId: user._id,
                ipAddress: ip,
                success: true,
                riskScore: fraudResult.riskScore,
                userAgent
            });

            res.json({
                success: true,
                message: recoveryUsed ? 'Verified via Recovery Code' : 'MFA Verified',
                _id: user._id,
                email: user.email,
                token: generateToken(user._id)
            });

        } else {
            // Failed MFA verification
            user.mfaFailedAttempts = (user.mfaFailedAttempts || 0) + 1;

            // Lock after 5 failed attempts
            if (user.mfaFailedAttempts >= 5) {
                user.mfaLockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
            }

            await user.save();

            res.status(400).json({
                success: false,
                message: 'Invalid token',
                attemptsRemaining: Math.max(0, 5 - user.mfaFailedAttempts)
            });
        }
    } catch (error) {
        console.error("MFA Verify Error:", error);
        res.status(500).json({ message: 'MFA verification failed' });
    }
});

// @route   POST /api/auth/mfa/disable
router.post('/mfa/disable', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.mfaEnabled = false;
        user.mfaSecret = undefined; // Clear the secret using the virtual setter (which sets mfaSecretEncrypted = null)
        await user.save();

        res.json({
            success: true,
            message: 'MFA Disabled',
            user: {
                _id: user._id,
                email: user.email,
                role: user.role,
                mfaEnabled: false
            }
        });
    } catch (error) {
        console.error("MFA Disable Error:", error);
        res.status(500).json({ message: 'Failed to disable MFA' });
    }
});

// @route   POST /api/auth/mfa/regenerate-codes
router.post('/mfa/regenerate-codes', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.mfaEnabled) {
            return res.status(400).json({ message: 'MFA is not enabled' });
        }

        // Generate Recovery Codes (5 codes, 10 chars each)
        const recoveryCodesPlain = [];
        const recoveryCodesHashed = [];

        for (let i = 0; i < 5; i++) {
            const code = crypto.randomBytes(5).toString('hex').toUpperCase(); // 10 chars
            recoveryCodesPlain.push(code);
            recoveryCodesHashed.push({ code: hashCode(code), used: false });
        }

        user.recoveryCodes = recoveryCodesHashed;
        await user.save();

        res.json({
            success: true,
            message: 'Recovery codes regenerated',
            recoveryCodes: recoveryCodesPlain
        });
    } catch (error) {
        console.error("Regenerate Codes Error:", error);
        res.status(500).json({ message: 'Failed to regenerate recovery codes' });
    }
});

module.exports = router;

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const speakeasy = require('speakeasy');
const User = require('../models/User');
const connectDB = require('../config/db');

// Load env vars
dotenv.config();

const testMFA = async () => {
    try {
        console.log("Connecting to DB...");
        await connectDB();

        const email = 'test_mfa_' + Date.now() + '@example.com';
        console.log(`Creating user: ${email}`);

        const user = await User.create({
            email,
            password: 'Password123!',
        });

        console.log("User created.");

        // Simulate MFA Setup
        const secret = speakeasy.generateSecret({ name: "SecureBankApp" });
        console.log(`Generated Secret: ${secret.base32}`);

        user.mfaSecret = secret.base32;
        await user.save();
        console.log("MFA Secret saved (encrypted).");

        // Fetch user again to test decryption
        const userRefetched = await User.findById(user._id);
        console.log(`Decrypted Secret from DB: ${userRefetched.mfaSecret}`);

        if (userRefetched.mfaSecret !== secret.base32) {
            console.error("FAILURE: Decrypted secret does NOT match original secret!");
            process.exit(1);
        } else {
            console.log("SUCCESS: Secret encryption/decryption works.");
        }

        // Generate Token
        const token = speakeasy.totp({
            secret: secret.base32,
            encoding: 'base32'
        });
        console.log(`Generated TOTP Token: ${token}`);

        // Verify Token
        const verified = speakeasy.totp.verify({
            secret: userRefetched.mfaSecret,
            encoding: 'base32',
            token: token,
            window: 1
        });

        if (verified) {
            console.log("SUCCESS: Token verification passed.");
        } else {
            console.error("FAILURE: Token verification failed.");
        }

        // Clean up
        await User.deleteOne({ _id: user._id });
        console.log("Test user deleted.");

        process.exit(0);

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

testMFA();

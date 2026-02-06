const axios = require('axios');
const speakeasy = require('speakeasy');
const mongoose = require('mongoose');
const User = require('../models/User'); // Direct DB access to cleanup
const connectDB = require('../config/db');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';
const EMAIL = `qa_test_${Date.now()}@example.com`;
const PASSWORD = 'Password123!';

// Cookies for CSRF
let cookieJar = [];
let csrfToken = '';

// Helper to manage cookies
const getAuthHeaders = (token = null) => {
    const headers = {
        'Content-Type': 'application/json',
        'Cookie': cookieJar.join('; ')
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
    return headers;
};

const extractCookies = (res) => {
    if (res.headers['set-cookie']) {
        res.headers['set-cookie'].forEach(c => cookieJar.push(c.split(';')[0]));
    }
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const runTest = async () => {
    try {
        console.log("🚀 Starting QA End-to-End Test...");

        // 1. Get CSRF Token
        console.log("\n1. Fetching CSRF Token...");
        const csrfRes = await axios.get(`${API_URL}/csrf-token`, { withCredentials: true });
        csrfToken = csrfRes.data.csrfToken;
        extractCookies(csrfRes);
        console.log("✅ CSRF Token obtained.");

        // 2. Register
        console.log(`\n2. Registering User: ${EMAIL}...`);
        await wait(500); // Rate limit buffer
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            email: EMAIL,
            password: PASSWORD
        }, { headers: getAuthHeaders() });

        if (regRes.status !== 201) throw new Error("Registration Failed");
        const token = regRes.data.token;
        const userId = regRes.data._id;
        console.log("✅ Registration Successful.");

        // 3. Setup MFA
        console.log("\n3. Setting up MFA...");
        await wait(500);
        const setupRes = await axios.post(`${API_URL}/auth/mfa/setup`, {}, { headers: getAuthHeaders(token) });
        const secret = setupRes.data.secret;
        console.log(`✅ MFA Setup Initiated. Secret: ${secret}`);

        // 4. Verify & Enable MFA
        console.log("\n4. Verifying MFA Token...");
        await wait(1000); // Wait for potential clock drift buffer validation
        const timeToken = speakeasy.totp({ secret: secret, encoding: 'base32' });
        const verifyRes = await axios.post(`${API_URL}/auth/mfa/verify`, {
            userId: userId,
            token: timeToken
        }, { headers: getAuthHeaders() });

        if (!verifyRes.data.success || !verifyRes.data.user.mfaEnabled) throw new Error("MFA Verification Failed");
        console.log("✅ MFA Enabled Successfully.");

        // 5. Login with MFA (Expect flow interruption)
        console.log("\n5. Testing Login with MFA Enabled (Same Account)...");
        await wait(500);
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        }, { headers: getAuthHeaders() });

        if (loginRes.data.mfaRequired !== true) throw new Error("Login did not ask for MFA");
        console.log("✅ Login correctly asked for MFA.");

        // 6. Complete MFA Login
        console.log("\n6. Completing MFA Login...");
        await wait(500);
        const loginTokenVal = speakeasy.totp({ secret: secret, encoding: 'base32' });
        const mfaLoginRes = await axios.post(`${API_URL}/auth/mfa/verify`, {
            userId: userId,
            token: loginTokenVal
        }, { headers: getAuthHeaders() });

        if (!mfaLoginRes.data.token) throw new Error("MFA Login failed to return token");
        const newToken = mfaLoginRes.data.token;
        console.log("✅ MFA Login Successful.");

        // 7. Disable MFA
        console.log("\n7. Disabling MFA...");
        await wait(500);
        const disableRes = await axios.post(`${API_URL}/auth/mfa/disable`, {}, { headers: getAuthHeaders(newToken) });
        if (!disableRes.data.success || disableRes.data.user.mfaEnabled !== false) throw new Error("Disable MFA Failed");
        console.log("✅ MFA Disabled.");

        // 8. Verify Normal Login (No MFA)
        console.log("\n8. Verifying Normal Login (Post-Disable)...");
        await wait(500);
        const finalLoginRes = await axios.post(`${API_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        }, { headers: getAuthHeaders() });

        if (finalLoginRes.data.mfaRequired) throw new Error("Login asked for MFA after disable");
        if (!finalLoginRes.data.token) throw new Error("Normal login failed");
        console.log("✅ Normal Login Successful.");

        // --- USER B SCENARIO (New Account) ---
        console.log("\n--- TEST SCENARIO: NEW ACCOUNT (USER B) ---");
        const EMAIL_B = `qa_test_B_${Date.now()}@example.com`;
        console.log(`9. Registering User B: ${EMAIL_B}...`);
        await wait(1000); // Wait for rate limit to reset (window is likely small or this pause helps)

        const regResB = await axios.post(`${API_URL}/auth/register`, {
            email: EMAIL_B,
            password: PASSWORD
        }, { headers: getAuthHeaders() });

        if (regResB.status !== 201) throw new Error("User B Registration Failed");
        console.log("✅ User B Registration Successful.");

        console.log("10. Logging in User B (Should have no MFA)...");
        await wait(500);
        const loginResB = await axios.post(`${API_URL}/auth/login`, {
            email: EMAIL_B,
            password: PASSWORD
        }, { headers: getAuthHeaders() });

        if (loginResB.data.mfaRequired) throw new Error("User B asked for MFA (Should be disabled by default)");
        if (!loginResB.data.token) throw new Error("User B Login Failed");
        console.log("✅ User B Login Successful.");

        // Cleanup
        await connectDB();
        await User.deleteMany({ email: { $in: [EMAIL, EMAIL_B] } });
        console.log("\n🧹 Cleanup: All test users deleted.");
        process.exit(0);

    } catch (error) {
        console.error("❌ TEST FAILED:", error.message);
        if (error.response) {
            console.error("Response Data:", error.response.data);
            if (error.response.status === 429) {
                console.error("⚠️ Rate Limit Hit! Consider increasing wait times or disabling limiter for testing.");
            }
        }
        process.exit(1);
    }
};

runTest();

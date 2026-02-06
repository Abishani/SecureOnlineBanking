const axios = require('axios');
const speakeasy = require('speakeasy');
const assert = require('assert');

const API_URL = 'http://localhost:5000/api';
let authToken = '';
let userId = '';
let userEmail = `qa_test_${Date.now()}@example.com`;
let userPassword = 'Password123!';
let mfaSecret = '';
let csrfToken = '';
let sessionCookie = '';

// Helper to configure headers
const getHeaders = () => {
    const headers = {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
    };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    if (sessionCookie) headers['Cookie'] = sessionCookie;
    return headers;
};

async function getCsrfToken() {
    try {
        const res = await axios.get(`${API_URL}/csrf-token`);
        csrfToken = res.data.csrfToken;

        // Extract cookies
        if (res.headers['set-cookie']) {
            sessionCookie = res.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
        }
        console.log('CSRF Token:', csrfToken);
        console.log('Session Cookie:', sessionCookie);
    } catch (err) {
        console.log('CSRF Token fetch failed:', err.message);
    }
}

async function runTest() {
    console.log('Starting E2E QA Test...');

    try {
        // 0. Get CSRF Token
        await getCsrfToken();
        if (!csrfToken || !sessionCookie) {
            throw new Error("Failed to initialize CSRF/Cookie");
        }

        // 1. Register
        console.log(`\n1. Registering user: ${userEmail}`);
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            email: userEmail,
            password: userPassword
        }, { headers: getHeaders() });

        assert.strictEqual(regRes.status, 201);
        assert.ok(regRes.data.token);
        authToken = regRes.data.token;
        userId = regRes.data._id;
        console.log('   ✅ Registration Successful');

        // 2. Initial Login (No MFA)
        console.log('\n2. Testing Login (No MFA)');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: userEmail,
            password: userPassword,
            mockIp: '127.0.0.1' // Avoid rate limit
        }, { headers: getHeaders() });

        assert.ok(loginRes.data.token);
        assert.strictEqual(loginRes.data.riskAnalysis.action, 'ALLOW');
        console.log('   ✅ Login Successful');

        // 3. Setup MFA
        console.log('\n3. Setting up MFA');
        const setupRes = await axios.post(`${API_URL}/auth/mfa/setup`, {}, { headers: getHeaders() });
        assert.ok(setupRes.data.secret);
        mfaSecret = setupRes.data.secret;
        console.log('   ✅ MFA Setup Initiated. Secret:', mfaSecret);

        // 4. Verify & Enable MFA
        console.log('\n4. Verifying MFA Code');
        const token = speakeasy.totp({
            secret: mfaSecret,
            encoding: 'base32'
        });

        const verifyRes = await axios.post(`${API_URL}/auth/mfa/verify`, {
            userId: userId,
            token: token
        }, { headers: getHeaders() });

        assert.strictEqual(verifyRes.data.success, true);
        assert.strictEqual(verifyRes.data.message, 'MFA Verified & Enabled');
        assert.strictEqual(verifyRes.data.user.mfaEnabled, true);
        console.log('   ✅ MFA Verified & Enabled');

        // 5. Login with MFA Enabled
        console.log('\n5. Logging in with MFA Enabled');
        const mfaLoginRes = await axios.post(`${API_URL}/auth/login`, {
            email: userEmail,
            password: userPassword,
            mockIp: '127.0.0.1'
        }, { headers: getHeaders() });

        // Should NOT return token yet
        assert.strictEqual(mfaLoginRes.data.success, false);
        assert.strictEqual(mfaLoginRes.data.mfaRequired, true);
        console.log('   ✅ Login correctly requested MFA');

        // 6. Complete MFA Login
        console.log('\n6. Completing MFA Login');
        const mfaLoginToken = speakeasy.totp({
            secret: mfaSecret,
            encoding: 'base32'
        });

        const mfaFinalRes = await axios.post(`${API_URL}/auth/mfa/verify`, {
            userId: userId,
            token: mfaLoginToken
        }, { headers: getHeaders() });

        assert.strictEqual(mfaFinalRes.data.success, true);
        assert.ok(mfaFinalRes.data.token);
        console.log('   ✅ MFA Login Successful');

        // 7. Disable MFA
        authToken = mfaFinalRes.data.token; // Update token just in case
        console.log('\n7. Disabling MFA');
        const disableRes = await axios.post(`${API_URL}/auth/mfa/disable`, {}, { headers: getHeaders() });
        assert.strictEqual(disableRes.data.success, true);
        assert.strictEqual(disableRes.data.user.mfaEnabled, false);
        console.log('   ✅ MFA Disabled');

        // 8. Verify Login (No MFA again)
        console.log('\n8. Verifying Login after Disable');
        const finalLoginRes = await axios.post(`${API_URL}/auth/login`, {
            email: userEmail,
            password: userPassword,
            mockIp: '127.0.0.1'
        }, { headers: getHeaders() });
        assert.ok(finalLoginRes.data.token);
        console.log('   ✅ Login Successful (No MFA)');

        console.log('\n🎉 ALL TESTS PASSED!');

    } catch (error) {
        console.error('\n❌ TEST FAILED');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

runTest();

const axios = require('axios');
const speakeasy = require('speakeasy');

const API_URL = 'http://localhost:5001/api';
let authToken = '';
let userId = '';
let mfaSecret = '';
let recoveryCodes = [];

// Cookie jar for CSRF
let cookies = '';

async function run() {
    try {
        console.log("=== STARTING VERIFICATION ===");

        // 0. Get CSRF Token (and cookies)
        let csrfToken = '';
        console.log("\n[0] Initializing...");
        try {
            const csrfRes = await axios.get('http://localhost:5001/api/csrf-token');
            if (csrfRes.headers['set-cookie']) {
                cookies = csrfRes.headers['set-cookie'];
            }
            if (csrfRes.data && csrfRes.data.csrfToken) {
                csrfToken = csrfRes.data.csrfToken;
                console.log("Got CSRF Token:", csrfToken);
            } else {
                console.log("CSRF Token not found in response.");
            }
        } catch (e) {
            console.log("CSRF Init Skipped/Failed (Might be ignored for API)");
        }

        const client = axios.create({
            baseURL: API_URL,
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookies,
                'X-CSRF-Token': csrfToken
            },
            validateStatus: () => true // Don't throw on error status
        });

        // 1. Register
        const email = `test_Verify_${Date.now()}@example.com`;
        const password = 'TestPassword123!';

        console.log(`\n[1] Registering user: ${email}`);
        let res = await client.post('/auth/register', { email, password });

        if (res.status !== 201) {
            console.error("Registration Failed:", res.data);
            return;
        }
        console.log("Registration Success!");
        authToken = res.data.token;
        userId = res.data._id;

        // 2. Setup MFA
        console.log("\n[2] Setting up MFA...");
        res = await client.post('/auth/mfa/setup', {}, { headers: { Authorization: `Bearer ${authToken}` } });

        if (!res.data.secret || (!res.data.recoveryCodes && !res.data.codes)) {
            console.error("MFA Setup Failed. Response keys:", Object.keys(res.data));
            if (res.data.recoveryCodes) console.log("Recovery Codes length:", res.data.recoveryCodes.length);
            return;
        }
        mfaSecret = res.data.secret;
        recoveryCodes = res.data.recoveryCodes;
        console.log("MFA Setup Success!");
        console.log("Recovery Codes:", recoveryCodes);

        // 3. Enable MFA (Verify)
        console.log("\n[3] Enabling MFA (Verifying TOTP)...");
        const token = speakeasy.totp({ secret: mfaSecret, encoding: 'base32' });
        res = await client.post('/auth/mfa/verify', { userId, token });

        if (!res.data.success) {
            console.error("MFA Enable Failed:", res.data);
            return;
        }
        console.log("MFA Enabled!");

        // 4. Relogin (Expect MFA Prompt)
        console.log("\n[4] Relogin to trigger MFA...");
        res = await client.post('/auth/login', { email, password });

        if (res.data.mfaRequired !== true) {
            console.error("Expected MFA Prompt, got:", res.data);
            return;
        }
        console.log("Login Prompted for MFA (Correct)");

        // 5. Verify with Recovery Code
        console.log("\n[5] Verifying with Recovery Code...");
        const codeToUse = recoveryCodes[0];
        res = await client.post('/auth/mfa/verify', { userId, token: codeToUse });

        if (!res.data.success) {
            console.error("Recovery Code Login Failed:", res.data);
            return;
        }
        console.log("Recovery Code Verification Success!");

        // 6. Verify Same Code Again (Should Fail)
        console.log("\n[6] Re-using same Recovery Code (Expect Failure)...");
        res = await client.post('/auth/mfa/verify', { userId, token: codeToUse });

        if (res.data.success) {
            console.error("Security Flaw: Re-used recovery code worked!");
        } else {
            console.log("Success: Re-used code was rejected.");
        }

        // 7. Test Lockout (Fraud Rule 1)
        console.log("\n[7] Testing Account Lockout (5 failed attempts)...");
        for (let i = 0; i < 5; i++) {
            process.stdout.write(`Attempt ${i + 1}... `);
            res = await client.post('/auth/login', { email, password: 'WrongPassword' });
        }
        console.log("");

        // Check if locked
        res = await client.post('/auth/login', { email, password });
        if (res.status === 403 && res.data.message.includes('locked')) {
            console.log("Success: Account is Locked!");
        } else {
            console.log("Failure: Account NOT locked.", res.data);
        }

        console.log("\n=== VERIFICATION COMPLETE ===");

    } catch (err) {
        console.error("Script Error:", err);
    }
}

run();

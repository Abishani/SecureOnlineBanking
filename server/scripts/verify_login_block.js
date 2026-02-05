const axios = require('axios');

const API_URL = 'http://localhost:5000/api/auth/login';
const EMAIL = 'test_block_' + Date.now() + '@example.com';

async function registerUser() {
    try {
        await axios.post('http://localhost:5000/api/auth/register', {
            email: EMAIL,
            password: 'password123'
        });
        console.log(`[SETUP] Registered User: ${EMAIL}`);
    } catch (err) {
        console.error('Registration failed', err.message);
    }
}

async function attemptLogin(attemptNum) {
    try {
        await axios.post(API_URL, {
            email: EMAIL,
            password: 'WRONG_PASSWORD'
        });
        console.log(`[Attempt ${attemptNum}] Failed (Expected generic error)`);
    } catch (err) {
        if (err.response) {
            console.log(`[Attempt ${attemptNum}] Response: Status ${err.response.status} - ${err.response.data.message}`);
            if (err.response.status === 403) {
                console.log("\n[SUCCESS] Server BLOCKED the account! 🛑");
                console.log("Reason: " + err.response.data.message);
                return true;
            }
        } else {
            console.log(`[Attempt ${attemptNum}] Error: ${err.message}`);
        }
    }
    return false;
}

async function runTest() {
    console.log("--- Starting Login Block Verification ---");
    await registerUser();

    // threshold is >= 4 failed attempts.
    // Attempt 1
    await attemptLogin(1);
    // Attempt 2
    await attemptLogin(2);
    // Attempt 3
    await attemptLogin(3);
    // Attempt 4 (Might trigger flag or block depending on rule config, usually just logs risk 0.3)
    await attemptLogin(4);
    // Attempt 5 (Should definitely BLOCK)
    const blocked = await attemptLogin(5);

    if (!blocked) {
        console.log("\n[WARNING] Account was NOT blocked after 5 attempts.");
        // Try one more
        await attemptLogin(6);
    }
}

runTest();

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/auth';
const NEW_USER_EMAIL = `user_${Date.now()}@test.com`;
const PASSWORD = 'securepass123';

async function runTest() {
    console.log("--- Testing Registration & Fraud Rules ---");

    // 1. Register New User
    try {
        console.log(`[1] Registering new user: ${NEW_USER_EMAIL}...`);
        await axios.post(`${BASE_URL}/register`, {
            email: NEW_USER_EMAIL,
            password: PASSWORD
        });
        console.log("    SUCCESS: Registration complete.");
    } catch (err) {
        console.error("    FAILED: Registration", err.response?.data || err.message);
        return;
    }

    // 2. Successful Login
    try {
        console.log(`[2] verifying valid login...`);
        const res = await axios.post(`${BASE_URL}/login`, {
            email: NEW_USER_EMAIL,
            password: PASSWORD
        });
        console.log("    SUCCESS: Login worked. Token received.");
    } catch (err) {
        console.error("    FAILED: Valid Login", err.response?.data || err.message);
        return;
    }

    // 3. Bruteforce Attack (Fail 5 times)
    console.log(`[3] Attempting 5 FAILED logins to trigger Block Rule...`);

    for (let i = 1; i <= 5; i++) {
        try {
            await axios.post(`${BASE_URL}/login`, {
                email: NEW_USER_EMAIL,
                password: "WRONG_PASSWORD_" + i
            });
            console.log(`    Attempt ${i}: Failed (Status 401 as expected)`);
        } catch (err) {
            if (err.response?.status === 403) {
                console.log(`    Attempt ${i}: BLOCKED! (Status 403)`);
                console.log(`    Message: ${err.response.data.message}`);
                console.log("\n✅ SUCCESS: Fraud rules correctly applied to new user.");
                return;
            } else if (err.response) {
                console.log(`    Attempt ${i}: Response ${err.response.status} - ${err.response.data.message}`);
            } else {
                console.log(`    Attempt ${i}: Error ${err.message}`);
            }
        }
    }

    console.log("\n❌ FAIL: Account was NOT blocked after 5 attempts.");
}

runTest();

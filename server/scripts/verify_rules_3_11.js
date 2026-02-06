const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/auth';
const EMAIL = `geo_test_${Date.now()}@example.com`;
const PASSWORD = 'password123';

async function runTest() {
    console.log("--- Testing Rule 3 (Geolocation) & Rule 11 (Lockouts) ---");

    // 1. Register
    try {
        await axios.post(`${BASE_URL}/register`, { email: EMAIL, password: PASSWORD });
        console.log(`[SETUP] Registered ${EMAIL}`);
    } catch (e) {
        console.error("Register failed");
        return;
    }

    // 2. Test Geolocation (Rule 3)
    console.log("\n[TEST] Rule 3: Unusual Geolocation");
    try {
        // First login (US - default) -> Should be ALLOW
        await axios.post(`${BASE_URL}/login`, { email: EMAIL, password: PASSWORD });
        console.log("  Login 1 (US): OK");

        // Second login (CN - via Mock Header) -> Should be FLAG (Risk 0.5)
        const res = await axios.post(`${BASE_URL}/login`,
            { email: EMAIL, password: PASSWORD },
            { headers: { 'X-Mock-Country': 'CN' } }
        );
        const risk = res.data.riskAnalysis;
        console.log(`  Login 2 (CN): Action=${risk.action} | Rules=${risk.triggeredRules.join(', ')}`);

        if (risk.triggeredRules.includes('UNUSUAL_LOCATION')) {
            console.log("  ✅ Rule 3 Triggered!");
        } else {
            console.log("  ❌ Rule 3 Failed.");
        }

    } catch (e) {
        console.error("  Error testing Geo:", e.message);
    }

    // 3. Test Account Lockout (Rule 11)
    console.log("\n[TEST] Rule 11: Recurring Lockouts");
    // Fail 5 times -> Get Blocked
    for (let i = 1; i <= 5; i++) {
        try {
            await axios.post(`${BASE_URL}/login`, { email: EMAIL, password: "WRONG" });
        } catch (e) { /* ignore 401/403 */ }
    }
    console.log("  Step 1: Account Blocked once (5 failed logins).");

    // Note: Rule 11 requires *multiple* lockouts.
    // We need to simulate a second lockout.
    // Since lockout time is usually 1 hour, we can't wait. 
    // BUT we can try 5 more fails. The account is *already* blocked.
    // Does "failing while blocked" count as another lockout?
    // In `checkMultipleLockouts`, we count `failReason: 'ACCOUNT_LOCKED'` in db.
    // So if we try to login while blocked, it logs 'ACCOUNT_LOCKED'.

    // Try failing 2 more times (Accessing while blocked)
    for (let i = 1; i <= 2; i++) {
        try {
            await axios.post(`${BASE_URL}/login`, { email: EMAIL, password: PASSWORD });
        } catch (e) {/* ignore */ }
    }

    // Now try with correct password + check risk
    // It will likely still be 403 (Blocked). But we want to see if Rule 11 *also* triggered.
    // However, if we are blocked, we can't see the risk object returned in 403 error.
    // Wait, my `auth.js` returns `risk` in 403!

    try {
        await axios.post(`${BASE_URL}/login`, { email: EMAIL, password: PASSWORD });
    } catch (e) {
        if (e.response && e.response.data.risk) {
            const rules = e.response.data.risk.triggeredRules;
            console.log(`  Final Login Attempt: Rules=${rules.join(', ')}`);
            if (rules.includes('REPEATED_LOCKOUTS')) { // Rule 11
                console.log("  ✅ Rule 11 Triggered!");
            } else {
                console.log("  ❌ Rule 11 Not Triggered (might need more attempts).");
            }
        } else {
            console.log("  Blocked, but no risk details:", e.response?.data?.message);
        }
    }
}

runTest();

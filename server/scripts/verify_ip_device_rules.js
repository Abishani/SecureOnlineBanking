const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/auth';
const EMAIL = `fraud_test_${Date.now()}@example.com`;
const PASSWORD = 'password123';

async function register() {
    try {
        await axios.post(`${BASE_URL}/register`, { email: EMAIL, password: PASSWORD });
        console.log(`[SETUP] Registered ${EMAIL}`);
    } catch (e) {
        console.error("Register failed", e.message);
    }
}

async function login(ip, userAgent, desc) {
    try {
        const res = await axios.post(`${BASE_URL}/login`,
            { email: EMAIL, password: PASSWORD },
            {
                headers: {
                    'X-Forwarded-For': ip,
                    'User-Agent': userAgent
                }
            }
        );

        const risk = res.data.riskAnalysis;
        console.log(`[${desc}] Status: ${res.status} | Action: ${risk.action} | Score: ${risk.riskScore}`);
        if (risk.triggeredRules.length > 0) {
            console.log(`   Triggered: ${risk.triggeredRules.join(', ')}`);
        }
    } catch (err) {
        if (err.response) {
            console.log(`[${desc}] BLOCKED/ERROR: ${err.response.status} - ${err.response.data.message}`);
            if (err.response.data.risk) {
                console.log(`   Action: ${err.response.data.risk.action} | Rules: ${err.response.data.risk.triggeredRules.join(', ')}`);
            }
        } else {
            console.log(`[${desc}] Error: ${err.message}`);
        }
    }
}

async function runTest() {
    console.log("--- Testing Advanced Fraud Rules ---");
    await register();

    // 1. Normal Login (Device A, IP 1)
    await login('192.168.1.1', 'Mozilla/5.0 (Windows NT 10.0)', 'Login 1 (Normal)');

    // 2. Rule 5: Device Mismatch (Same IP, Different Device)
    // Should trigger Flag/Monitor logic? Config dependent.
    // Rule 5 risk is 0.2? (Check index.js)
    await login('192.168.1.1', 'Mozilla/5.0 (iPhone)', 'Login 2 (New Device)');

    // 3. Rule 2: Multiple IPs (Rapid change)
    // We need 3 distinct IPs in 1 hour.
    await login('192.168.1.2', 'Mozilla/5.0 (Windows NT 10.0)', 'Login 3 (New IP 2)');
    await login('192.168.1.3', 'Mozilla/5.0 (Windows NT 10.0)', 'Login 4 (New IP 3 - Should Trigger)');

}

runTest();

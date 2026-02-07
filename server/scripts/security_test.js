const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let AUTH_TOKEN = '';
let USER_ID = '';

// Helper: Color logging
const log = (msg, type = 'info') => {
    const colors = { info: '\x1b[36m', pass: '\x1b[32m', fail: '\x1b[31m', reset: '\x1b[0m' };
    console.log(`${colors[type]}[${type.toUpperCase()}] ${msg}${colors.reset}`);
};

const runTests = async () => {
    log('Starting Security Verification...', 'info');

    // 1. Register User
    try {
        const email = `testuser_${Date.now()}@example.com`;
        const res = await axios.post(`${API_URL}/auth/register`, { email, password: 'password123' });
        AUTH_TOKEN = res.data.token;
        USER_ID = res.data._id;
        log(`Registered User: ${email}`, 'pass');
    } catch (e) {
        log('Registration Failed', 'fail');
        return;
    }

    // 2. Test Rule 1: Multiple Failed Logins
    log('\n--- Testing Rule 1: Multiple Failed Logins ---', 'info');
    let failedCount = 0;
    try {
        for (let i = 0; i < 5; i++) {
            try {
                await axios.post(`${API_URL}/auth/login`, { email: `testuser_${Date.now()}@example.com`, password: 'wrongpassword' });
            } catch (e) {
                if (e.response.status === 401) failedCount++;
            }
        }
        if (failedCount === 5) log('Failed 5 times as expected', 'pass');

        // 5th attempt (Might be same user or strict lockout, but for now we check if logic captured it)
        // Since we used different random emails, the "Same User" lockout won't trigger unless we use Same Email.
        // Let's retry with SAME email.
        const sameEmail = `victim_${Date.now()}@example.com`;
        await axios.post(`${API_URL}/auth/register`, { email: sameEmail, password: 'realpassword' });

        for (let i = 0; i < 5; i++) {
            try {
                await axios.post(`${API_URL}/auth/login`, { email: sameEmail, password: 'WRONG' });
            } catch (e) {
                if (e.response && e.response.status === 403) {
                    log('Account Locked on attempt ' + (i + 1), 'pass');
                    break;
                }
                if (i === 4 && e.response.status !== 403) {
                    log('Warning: Account not 403 blocked yet (Risk accumulating)', 'info');
                }
            }
        }

    } catch (e) {
        log('Error in Failed Login Test', 'fail');
    }

    // 3. Test Rule 7: Transaction Velocity
    log('\n--- Testing Rule 7: Transaction Velocity ---', 'info');
    try {
        for (let i = 0; i < 6; i++) {
            try {
                await axios.post(`${API_URL}/transactions`, {
                    amount: 50,
                    recipient: 'someone@check.com'
                }, { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } });
                process.stdout.write('.');
            } catch (e) {
                if (e.response && e.response.status === 403) {
                    log('\nVelocity Limit Triggered (Blocked)', 'pass');
                    break;
                }
            }
        }
    } catch (e) {
        log('Error in Velocity Test', 'fail');
    }

    // 4. Test Transaction Amount Anomaly
    log('\n--- Testing Rule 8: Amount Anomaly ---', 'info');
    try {
        // User has avg ~50 from previous test
        try {
            await axios.post(`${API_URL}/transactions`, {
                amount: 5000,
                recipient: 'hacker@check.com'
            }, { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } });
        } catch (e) {
            if (e.response && e.response.status === 403) {
                log('High Amount Blocked (Anomaly Detected)', 'pass');
            } else {
                log(`Transaction went through? Status: ${e.response?.status}`, 'fail');
            }
        }
    } catch (e) {
        log('Error in Anomaly Test', 'fail');
    }
};

runTests();

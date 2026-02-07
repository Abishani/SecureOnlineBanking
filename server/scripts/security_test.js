const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let AUTH_TOKEN = '';
let USER_ID = '';
let CSRF_TOKEN = '';
let COOKIE = '';

// Helper: Color logging
const log = (msg, type = 'info') => {
    const colors = { info: '\x1b[36m', pass: '\x1b[32m', fail: '\x1b[31m', reset: '\x1b[0m' };
    console.log(`${colors[type]}[${type.toUpperCase()}] ${msg}${colors.reset}`);
};

// Helper: Headers builder
const getHeaders = (withAuth = false) => {
    const headers = {
        'X-CSRF-Token': CSRF_TOKEN,
        'Cookie': COOKIE
    };
    if (withAuth && AUTH_TOKEN) {
        headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
    }
    return { headers };
};

const runTests = async () => {
    log('Starting Security Verification...', 'info');

    // 0. Get CSRF Token
    try {
        const res = await axios.get('http://localhost:5000/api/csrf-token');
        CSRF_TOKEN = res.data.csrfToken;
        COOKIE = res.headers['set-cookie'];
        log('CSRF Token Fetched', 'pass');
    } catch (e) {
        log('Failed to fetch CSRF Token: ' + e.message, 'fail');
        return;
    }

    // 1. Register User
    try {
        const email = `testuser_${Date.now()}@example.com`;
        const res = await axios.post(`${API_URL}/auth/register`, { email, password: 'Password123' }, getHeaders());
        AUTH_TOKEN = res.data.token;
        USER_ID = res.data._id;
        log(`Registered User: ${email}`, 'pass');
    } catch (e) {
        log('Registration Failed: ' + (e.response?.data?.message || e.message), 'fail');
        return;
    }

    // 2. Test Rule 1: Multiple Failed Logins
    log('\n--- Testing Rule 1: Multiple Failed Logins ---', 'info');
    let failedCount = 0;
    try {
        for (let i = 0; i < 5; i++) {
            try {
                await axios.post(`${API_URL}/auth/login`, { email: `testuser_${Date.now()}@example.com`, password: 'wrongpassword' }, getHeaders());
            } catch (e) {
                if (e.response && e.response.status === 401) failedCount++;
            }
        }
        if (failedCount === 5) log('Failed 5 times as expected', 'pass');

        // Lockout Test
        const sameEmail = `victim_${Date.now()}@example.com`;
        await axios.post(`${API_URL}/auth/register`, { email: sameEmail, password: 'Password123' }, getHeaders());

        for (let i = 0; i < 5; i++) {
            try {
                await axios.post(`${API_URL}/auth/login`, { email: sameEmail, password: 'WRONG' }, getHeaders());
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

    // 2.5 Test Rule 2: Multiple IPs
    log('\n--- Testing Rule 2: Multiple IPs ---', 'info');
    try {
        const ipUserEmail = `ip_test_${Date.now()}@example.com`;
        // Register user
        await axios.post(`${API_URL}/auth/register`, { email: ipUserEmail, password: 'Password123' }, getHeaders());

        // Login with IP 1
        await axios.post(`${API_URL}/auth/login`, {
            email: ipUserEmail,
            password: 'Password123',
            mockIp: '1.1.1.1'
        }, getHeaders());
        process.stdout.write('.');

        // Login with IP 2
        await axios.post(`${API_URL}/auth/login`, {
            email: ipUserEmail,
            password: 'Password123',
            mockIp: '2.2.2.2'
        }, getHeaders());
        process.stdout.write('.');

        // Login with IP 3 (Should Trigger Rule 2)
        const res3 = await axios.post(`${API_URL}/auth/login`, {
            email: ipUserEmail,
            password: 'Password123',
            mockIp: '3.3.3.3'
        }, getHeaders());

        if (res3.data.riskAnalysis && res3.data.riskAnalysis.triggeredRules.includes('MULTIPLE_IPS')) {
            log('\nRule 2 Triggered: Multiple IPs detected', 'pass');
        } else {
            log('\nRule 2 Failed to Trigger', 'fail');
            console.log(JSON.stringify(res3.data, null, 2));
        }

    } catch (e) {
        log('Error in Multiple IPs Test', 'fail');
        console.error(e.response ? e.response.data : e.message);
    }

    // 3. Test Rule 7: Transaction Velocity
    log('\n--- Testing Rule 7: Transaction Velocity ---', 'info');
    try {
        for (let i = 0; i < 6; i++) {
            try {
                await axios.post(`${API_URL}/transactions`, {
                    amount: 50,
                    recipient: 'someone@check.com'
                }, getHeaders(true)); // Use Auth Token
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
        try {
            await axios.post(`${API_URL}/transactions`, {
                amount: 5000,
                recipient: 'hacker@check.com'
            }, getHeaders(true));
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

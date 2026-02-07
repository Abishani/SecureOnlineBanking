const axios = require('axios');
const assert = require('assert');

const API_URL = 'http://localhost:5000/api';
let userEmail = `bug_repro_${Date.now()}@example.com`;
let userPassword = 'Password123!';
let csrfToken = '';
let sessionCookie = '';

// Helper to configure headers
const getHeaders = () => {
    const headers = {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
    };
    if (sessionCookie) headers['Cookie'] = sessionCookie;
    return headers;
};

async function getCsrfToken() {
    try {
        const res = await axios.get(`${API_URL}/csrf-token`);
        csrfToken = res.data.csrfToken;
        if (res.headers['set-cookie']) {
            sessionCookie = res.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
        }
        console.log('CSRF Token:', csrfToken);
    } catch (err) {
        console.log('CSRF Token fetch failed:', err.message);
    }
}

async function runTest() {
    console.log('Starting Bug Reproduction Test...');

    try {
        await getCsrfToken();

        // 1. Register
        console.log(`\n1. Registering user: ${userEmail}`);
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            email: userEmail,
            password: userPassword
        }, { headers: getHeaders() });

        assert.strictEqual(regRes.status, 201);
        console.log('   ✅ Registration Successful');

        // 2. Login immediately
        console.log('\n2. Attempting Login immediately after registration');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: userEmail,
            password: userPassword,
            mockIp: '127.0.0.1'
        }, { headers: getHeaders() });

        assert.ok(loginRes.data.token, "Login should return a token");
        console.log('   ✅ Login Successful');

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

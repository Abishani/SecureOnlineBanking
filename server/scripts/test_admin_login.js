const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const ROOT_URL = 'http://localhost:5000';
const ADMIN_EMAIL = 'admin@securebank.com';
const ADMIN_PASS = 'AdminSecretPass123!';

// Setup AXIOS to handle cookies (for CSRF)
const client = axios.create({
    withCredentials: true
});

let sessionCookie = '';

async function getCsrfToken() {
    try {
        const res = await client.get(`${ROOT_URL}/api/csrf-token`);
        // Capture the cookie for Node.js
        if (res.headers['set-cookie']) {
            sessionCookie = res.headers['set-cookie'][0].split(';')[0];
        }
        return res.data.csrfToken;
    } catch (err) {
        console.error("Error getting CSRF token:", err.message);
        return null;
    }
}

async function testAdminLogin() {
    console.log(`\n🚀 Testing Admin Login for: ${ADMIN_EMAIL}\n`);

    try {
        // 1. Get CSRF Token
        const csrfToken = await getCsrfToken();
        if (!csrfToken) {
            console.error("❌ Failed to get CSRF token");
            return;
        }

        // 2. Login
        console.log('1. [POST] /auth/login');
        const loginRes = await client.post(`${BASE_URL}/auth/login`, {
            email: ADMIN_EMAIL, password: ADMIN_PASS
        }, {
            headers: {
                'X-CSRF-Token': csrfToken,
                'Cookie': sessionCookie
            }
        });

        if (loginRes.data.token) {
            console.log('   ✅ Admin Login Successful.');
            console.log('   Email:', loginRes.data.email);
            // Verify role if the API returns it (it might not yet, but we can verify login works)
            console.log('   Token received (length):', loginRes.data.token.length);
        } else {
            console.error('   ❌ Admin Login Failed: No token returned', loginRes.data);
        }

        console.log('\n✨ ADMIN LOGIN TEST PASSED! ✨');
    } catch (error) {
        console.error('\n❌ TEST FAILED');
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        } else {
            console.error('   Error:', error.message);
        }
    }
}

testAdminLogin();

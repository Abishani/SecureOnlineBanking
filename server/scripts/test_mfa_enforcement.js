const axios = require('axios');
const speakeasy = require('speakeasy');

const BASE_URL = 'http://localhost:5000/api';
const ROOT_URL = 'http://localhost:5000';
const USER_EMAIL = `mfa_test_${Date.now()}@example.com`;
const USER_PASS = 'SecurePass123!';

// Setup AXIOS to handle cookies (for CSRF)
const client = axios.create({
    withCredentials: true
});

let userId = '';
let mfaSecret = '';
let authToken = '';
let sessionCookie = '';

async function getCsrfToken() {
    const res = await client.get(`${ROOT_URL}/api/csrf-token`);
    // Capture the cookie for Node.js (since axios doesn't store it automatically)
    if (res.headers['set-cookie']) {
        sessionCookie = res.headers['set-cookie'][0].split(';')[0];
    }
    return res.data.csrfToken;
}

async function runTest() {
    console.log(`\n🚀 Testing MFA Enforcement Flow (with CSRF) for: ${USER_EMAIL}\n`);

    try {
        // 1. REGISTER
        console.log('1. [POST] /auth/register');
        const csrfToken1 = await getCsrfToken();
        const regRes = await client.post(`${BASE_URL}/auth/register`, {
            email: USER_EMAIL, password: USER_PASS
        }, {
            headers: {
                'X-CSRF-Token': csrfToken1,
                'Cookie': sessionCookie
            }
        });
        userId = regRes.data._id;
        authToken = regRes.data.token;
        console.log('   ✅ Registered. ID:', userId);

        // 2. SETUP MFA (Enable It)
        console.log('\n2. [POST] /auth/mfa/setup');
        const csrfToken2 = await getCsrfToken();
        const setupRes = await client.post(`${BASE_URL}/auth/mfa/setup`, {}, {
            headers: {
                Authorization: `Bearer ${authToken}`,
                'X-CSRF-Token': csrfToken2,
                'Cookie': sessionCookie
            }
        });
        mfaSecret = setupRes.data.secret;
        console.log('   ✅ Secret received:', mfaSecret);

        // 3. FIRST VERIFY (To Enable)
        console.log('\n3. [POST] /auth/mfa/verify (Activating MFA)');
        const csrfToken3 = await getCsrfToken();
        const token1 = speakeasy.totp({ secret: mfaSecret, encoding: 'base32' });
        await client.post(`${BASE_URL}/auth/mfa/verify`, { userId, token: token1 }, {
            headers: {
                'X-CSRF-Token': csrfToken3,
                'Cookie': sessionCookie
            }
        });
        console.log('   ✅ MFA Enabled.');

        // 4. LOGIN (Should Ask for MFA)
        console.log('\n4. [POST] /auth/login (expecting mfaRequired)');
        const csrfToken4 = await getCsrfToken();
        const loginRes = await client.post(`${BASE_URL}/auth/login`, {
            email: USER_EMAIL, password: USER_PASS
        }, {
            headers: {
                'X-CSRF-Token': csrfToken4,
                'Cookie': sessionCookie
            }
        });

        if (loginRes.data.mfaRequired) {
            console.log('   ✅ Server requested MFA as expected.');
        } else {
            console.error('   ❌ FAILURE: Server did NOT ask for MFA!', loginRes.data);
            return;
        }

        // 5. LOGIN VERIFY (Should Return Token)
        console.log('\n5. [POST] /auth/mfa/verify (Final Login)');
        const csrfToken5 = await getCsrfToken();
        const token2 = speakeasy.totp({ secret: mfaSecret, encoding: 'base32' });
        const finalRes = await client.post(`${BASE_URL}/auth/mfa/verify`, { userId, token: token2 }, {
            headers: {
                'X-CSRF-Token': csrfToken5,
                'Cookie': sessionCookie
            }
        });

        if (finalRes.data.token) {
            console.log('   ✅ Login Complete. Token Received:', finalRes.data.token.substring(0, 15) + '...');
        } else {
            console.error('   ❌ FAILURE: No token received after MFA verify!', finalRes.data);
            return;
        }

        console.log('\n✨ MFA ENFORCEMENT TEST PASSED! ✨');

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

runTest();

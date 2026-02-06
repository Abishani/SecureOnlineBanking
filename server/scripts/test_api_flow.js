const axios = require('axios');
const speakeasy = require('speakeasy'); // Valid token generation

const BASE_URL = 'http://localhost:5000/api';
const USER_EMAIL = `api_test_${Date.now()}@example.com`;
const USER_PASS = 'password123';

let authToken = '';
let userId = '';
let mfaSecret = '';

async function runTests() {
    console.log(`\n🚀 Starting API Endpoints Test for: ${USER_EMAIL}\n`);

    try {
        // 1. REGISTER
        console.log('1. [POST] /auth/register');
        const regRes = await axios.post(`${BASE_URL}/auth/register`, {
            email: USER_EMAIL, password: USER_PASS
        });
        console.log('   ✅ Registered. ID:', regRes.data._id);

        // 2. LOGIN
        console.log('\n2. [POST] /auth/login');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: USER_EMAIL, password: USER_PASS
        });
        authToken = loginRes.data.token;
        userId = loginRes.data._id;
        console.log('   ✅ Logged in. Token received.');

        // 3. MFA SETUP
        console.log('\n3. [POST] /auth/mfa/setup');
        const mfaSetupRes = await axios.post(`${BASE_URL}/auth/mfa/setup`, { userId });
        mfaSecret = mfaSetupRes.data.secret;
        console.log('   ✅ MFA Secret received:', mfaSecret);

        // 4. MFA VERIFY (Generate valid token locally)
        console.log('\n4. [POST] /auth/mfa/verify');
        const token = speakeasy.totp({
            secret: mfaSecret,
            encoding: 'base32'
        });
        await axios.post(`${BASE_URL}/auth/mfa/verify`, {
            userId, token
        });
        console.log('   ✅ MFA Verified & Enabled with token:', token);

        // 5. CREATE TRANSACTION
        console.log('\n5. [POST] /transactions');
        const txRes = await axios.post(`${BASE_URL}/transactions`,
            { recipient: 'friend@test.com', amount: 500 },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        console.log('   ✅ Transaction Created. Status:', txRes.data.status);

        // 6. GET TRANSACTIONS
        console.log('\n6. [GET] /transactions');
        const histRes = await axios.get(`${BASE_URL}/transactions`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log(`   ✅ History Retrieved. count: ${histRes.data.length}`);

        console.log('\n✨ ALL TESTS PASSED! ✨');

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

runTests();

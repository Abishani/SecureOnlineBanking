const axios = require('axios');

async function createDemoUser() {
    try {
        await axios.post('http://localhost:5000/api/auth/register', {
            email: 'demo@example.com',
            password: 'password123'
        });
        console.log("SUCCESS: Created user demo@example.com / password123");
    } catch (err) {
        if (err.response && err.response.status === 400) {
            console.log("INFO: Demo user already exists.");
        } else {
            console.error("ERROR: Failed to create user", err.message);
        }
    }
}

createDemoUser();

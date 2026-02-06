const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const connectDB = require('../config/db');

dotenv.config();

const seedAdmin = async () => {
    try {
        await connectDB();

        const adminEmail = 'admin@securebank.com';
        const adminPassword = 'AdminSecretPass123!';

        const userExists = await User.findOne({ email: adminEmail });

        if (userExists) {
            console.log('Admin user already exists');
            // Ensure role is admin (fix if it was created as user)
            if (userExists.role !== 'admin') {
                userExists.role = 'admin';
                await userExists.save();
                console.log('Updated existing user to Admin role');
            }
        } else {
            const admin = await User.create({
                email: adminEmail,
                password: adminPassword,
                role: 'admin',
                mfaEnabled: false // Admin can set up MFA later
            });
            console.log(`Admin created: ${admin.email}`);
        }

        process.exit();
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();

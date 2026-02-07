const LoginAttempt = require('../../models/LoginAttempt');
const Transaction = require('../../models/Transaction');
const User = require('../../models/User');

// --- LOGIN RULES ---

// Rule 1: Multiple Failed Logins
// Trigger: >= 4 failed attempts in last 15 minutes
async function checkMultipleFailedLogins(email) {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const failures = await LoginAttempt.countDocuments({
        email,
        success: false,
        timestamp: { $gte: fifteenMinutesAgo }
    });

    if (failures >= 4) {
        return { triggered: true, risk: 0.8, rule: 'MULTIPLE_FAILED_LOGINS', desc: `Detected ${failures} failed logins` };
    }
    return null;
}

// Rule 2: Multiple IPs
// Trigger: >= 3 distinct IPs in last 1 hour
async function checkMultipleIPs(userId, currentIp) {
    if (!userId) return null;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const attempts = await LoginAttempt.distinct('ipAddress', {
        userId,
        timestamp: { $gte: oneHourAgo }
    });

    const distinctIPs = new Set(attempts);
    if (currentIp) distinctIPs.add(currentIp);

    if (distinctIPs.size >= 3) {
        return { triggered: true, risk: 0.35, rule: 'MULTIPLE_IPS', desc: `Login attempts from ${distinctIPs.size} distinct IPs` };
    }
    return null;
}

// Rule 3: Unusual Geolocation (Mocked)
// Trigger: Login from a Country distinct from 'usual' (Mocked via X-Mock-Country header for test)
async function checkUnusualLocation(userId, mockCountry) {
    if (!userId) return null;
    const user = await User.findById(userId);

    // Default to "US" if no mock provided
    const currentCountry = mockCountry || "US";

    if (!user.usualGeolocations || user.usualGeolocations.length === 0) {
        user.usualGeolocations = ["US"];
        await user.save();
        return null;
    }

    if (!user.usualGeolocations.includes(currentCountry)) {
        return {
            triggered: true,
            risk: 0.5,
            rule: 'UNUSUAL_LOCATION',
            desc: `Login from unusual location: ${currentCountry}`
        };
    }
    return null;
}

// Rule 4: Unusual Time
// Trigger: Login between 00:00 and 05:00 (Configurable)
async function checkUnusualTime() {
    const hour = new Date().getHours();
    // Assuming 'Unusual' is late night for this demo user profile
    if (hour >= 0 && hour < 5) {
        // if (hour >= 0 && hour < 24){
        return { triggered: true, risk: 0.15, rule: 'UNUSUAL_TIME', desc: 'Login during unusual hours (12AM-5AM)' };
    }
    return null;
}

// Rule 5: Device/Browser Mismatch
// Trigger: Login from a User-Agent not seen before for this user
async function checkDeviceMismatch(userId, userAgent) {
    if (!userId || !userAgent) return null;
    const user = await User.findById(userId);

    // If no devices recorded yet, add this one and return safe
    if (!user.knownDevices || user.knownDevices.length === 0) {
        user.knownDevices = [userAgent];
        await user.save();
        return null;
    }

    if (!user.knownDevices.includes(userAgent)) {
        // Add new device to known list? In strict mode, we flag it first.
        // For this demo, we flag it as risk.
        return { triggered: true, risk: 0.2, rule: 'NEW_DEVICE', desc: 'Login from unrecognized device/browser' };
    }
    return null;
}

// Rule 11: Multiple Account Lockouts
// Trigger: User has been locked out more than once in 24 hours
async function checkMultipleLockouts(email) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    // We check LoginAttempts that had "failReason: ACCOUNT_LOCKED" (need to ensure we log this)
    // Or simpler: check if 'lockUntil' was updated recently multiple times.
    // Let's query LoginAttempts for block events
    const blocks = await LoginAttempt.countDocuments({
        email,
        failReason: 'ACCOUNT_LOCKED',
        timestamp: { $gte: twentyFourHoursAgo }
    });

    if (blocks >= 2) {
        return { triggered: true, risk: 0.4, rule: 'REPEATED_LOCKOUTS', desc: `User account locked out ${blocks} times in 24h` };
    }
    return null;
}

// --- TRANSACTION RULES ---

// Rule 7: Velocity Check
// Trigger: > 5 transactions in 1 minute
async function checkTransactionVelocity(userId) {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const count = await Transaction.countDocuments({
        userId,
        timestamp: { $gte: oneMinuteAgo }
    });

    if (count > 5) {
        return { triggered: true, risk: 0.4, rule: 'HIGH_VELOCITY', desc: `High transaction volume: ${count} in 1 min` };
    }
    return null;
}

// Rule 8: Amount Anomaly
// Trigger: Amount > 300% of average (Simplistic implementation)
async function checkAmountAnomaly(userId, amount) {
    const user = await User.findById(userId);
    if (!user || !user.averageTransactionAmount || user.averageTransactionAmount === 0) return null;

    if (amount > (user.averageTransactionAmount * 3)) {
        return { triggered: true, risk: 0.3, rule: 'AMOUNT_ANOMALY', desc: `Amount ${amount} exceeds 3x average (${user.averageTransactionAmount})` };
    }
    return null;
}

module.exports = {
    checkMultipleFailedLogins,
    checkMultipleIPs,
    checkUnusualLocation,
    checkUnusualTime,
    checkDeviceMismatch,
    checkMultipleLockouts,
    checkMultipleLockouts
};

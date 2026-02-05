const rules = require('./rules');
const FraudAlert = require('../models/FraudAlert');

class FraudEngine {

    // Evaluate Login Risk
    async evaluateLogin(context) {
        const { email, userId, ip } = context;
        let totalRisk = 0;
        const triggeredRules = [];
        const details = {};

        // Run Rules
        const r1 = await rules.checkMultipleFailedLogins(email);
        if (r1) {
            totalRisk += r1.risk;
            triggeredRules.push(r1.rule);
            details[r1.rule] = r1.desc;
        }

        const r2 = await rules.checkMultipleIPs(userId);
        if (r2) {
            totalRisk += r2.risk;
            triggeredRules.push(r2.rule);
            details[r2.rule] = r2.desc;
        }

        const r4 = await rules.checkUnusualTime();
        if (r4) {
            totalRisk += r4.risk;
            triggeredRules.push(r4.rule);
            details[r4.rule] = r4.desc;
        }

        // Rule 11: Account Lockouts
        const r11 = await rules.checkMultipleLockouts(email);
        if (r11) {
            totalRisk += r11.risk;
            triggeredRules.push(r11.rule);
            details[r11.rule] = r11.desc;
        }

        // Rule 5: Device Mismatch (Requires userAgent)
        const userAgent = context.userAgent;
        const r5 = await rules.checkDeviceMismatch(userId, userAgent);
        if (r5) {
            totalRisk += r5.risk;
            triggeredRules.push(r5.rule);
            details[r5.rule] = r5.desc;
        }

        // Determine Action
        const result = {
            action: 'ALLOW',
            riskScore: totalRisk,
            triggeredRules
        };

        if (totalRisk >= 0.7) {
            result.action = 'BLOCK';
            await this.logAlert(userId || null, 'LOGIN_BLOCK', 'HIGH', result, ip);
        } else if (totalRisk >= 0.5) {
            result.action = 'FLAG';
            await this.logAlert(userId || null, 'LOGIN_FLAG', 'MEDIUM', result, ip);
        } else if (totalRisk >= 0.3) {
            // Just Log, don't flag user yet
            result.action = 'MONITOR';
            await this.logAlert(userId || null, 'LOGIN_MONITOR', 'LOW', result, ip);
        }

        return result;
    }

    // Log Alert to DB
    async logAlert(userId, type, severity, result, ip) {
        await FraudAlert.create({
            userId,
            alertType: type,
            severity,
            triggeredRules: result.triggeredRules,
            riskScore: result.riskScore,
            ipAddress: ip,
            details: result,
            status: 'PENDING'
        });
    }
}

module.exports = new FraudEngine();

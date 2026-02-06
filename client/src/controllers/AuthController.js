import AuthModel from '../models/AuthModel';
import api from '../services/api';

class AuthController {
    async handleLogin(email, password, extraParams = {}) {
        // 1. Validate Input
        if (!email || !password) {
            return { success: false, error: 'Please provide email and password' };
        }

        // 2. Call Model
        const result = await AuthModel.login(email, password, extraParams);

        // 3. Process Result
        if (result.success) {
            return { success: true };
        } else {
            // Handle Fraud Block specifically
            if (result.risk && result.risk.action === 'BLOCK') {
                return { success: false, error: `Account Blocked! Risk Score: ${result.risk.riskScore}` };
            }
            return { success: false, error: result.error };
        }
    }

    async handleRegister(email, password) {
        if (password.length < 6) {
            return { success: false, error: 'Password must be at least 6 characters' };
        }
        const result = await AuthModel.register(email, password);
        return result;
    }

    async setupMFA(userId) {
        try {
            const response = await api.post('/auth/mfa/setup', { userId });
            return { success: true, data: response.data };
        } catch (error) {
            console.error("MFA Setup Error Details:", error.response);
            return { success: false, error: error.response?.data?.message || 'MFA Setup Failed' };
        }
    }

    async verifyMFA(userId, token) {
        try {
            const response = await api.post('/auth/mfa/verify', { userId, token });
            return { success: true };
        } catch (error) {
            return { success: false, error: 'Invalid Code' };
        }
    }
}

export default new AuthController();

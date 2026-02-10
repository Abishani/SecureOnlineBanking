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
        } else if (result.mfaRequired) {
            return { success: false, mfaRequired: true, userId: result.userId };
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

    async setupMFA() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                return { success: false, error: 'Not authenticated' };
            }

            const response = await api.post('/auth/mfa/setup', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error("MFA Setup Error Details:", error.response);
            return { success: false, error: error.response?.data?.message || 'MFA Setup Failed' };
        }
    }

    async verifyMFA(userId, token) {
        try {
            const response = await api.post('/auth/mfa/verify', { userId, token });

            // If the response contains a token (Login Flow), save it
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
            }

            // Always update user object if returned (Handles Setup & Login flows)
            if (response.data.user) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
            } else if (response.data._id) {
                // Fallback for login flow if user object isn't nested
               
                localStorage.setItem('user', JSON.stringify({
                    _id: response.data._id,
                    email: response.data.email,
                    role: response.data.role,
                    mfaEnabled: true
                }));
            }

            return { success: true };
        } catch (error) {
            return { success: false, error: 'Invalid Code' };
        }
    }

    async disableMFA() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return { success: false, error: 'Not authenticated' };

            const response = await api.post('/auth/mfa/disable', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.user) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || 'Failed to disable MFA' };
        }
    }
    async regenerateRecoveryCodes() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return { success: false, error: 'Not authenticated' };

            const response = await api.post('/auth/mfa/regenerate-codes', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            return { success: true, codes: response.data.recoveryCodes };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || 'Failed to regenerate codes' };
        }
    }
}

export default new AuthController();

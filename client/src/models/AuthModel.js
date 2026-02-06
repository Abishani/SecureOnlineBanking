import api from '../services/api';

class AuthModel {
    async login(email, password, extraParams = {}) {
        try {
            const response = await api.post('/auth/login', { email, password, ...extraParams });
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data));
            }
            return { success: true, data: response.data };
        } catch (error) {
            console.error("Login Model Error:", error.response);
            return {
                success: false,
                error: error.response?.data?.message || 'Login failed',
                risk: error.response?.data?.risk
            };
        }
    }

    async register(email, password) {
        try {
            const response = await api.post('/auth/register', { email, password });
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data));
            }
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || 'Registration failed' };
        }
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    getCurrentUser() {
        return JSON.parse(localStorage.getItem('user'));
    }
}

export default new AuthModel();

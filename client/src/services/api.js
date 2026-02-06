import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    withCredentials: true, // Required for CSRF cookies
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add Token and CSRF
api.interceptors.request.use(async (config) => {
    // 1. Add Auth Token
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. Add CSRF Token for state-changing requests
    if (['post', 'put', 'delete', 'patch'].includes(config.method.toLowerCase())) {
        try {
            // First, get a token if we don't have one (or just fetch fresh)
            // In a real app, you might cache this or get it from a cookie
            const csrfRes = await axios.get(`${api.defaults.baseURL.replace('/api', '')}/api/csrf-token`, { withCredentials: true });
            config.headers['X-CSRF-Token'] = csrfRes.data.csrfToken;
        } catch (err) {
            console.error("Failed to fetch CSRF token", err);
        }
    }

    return config;
}, (error) => Promise.reject(error));

// Interceptor to handle 401 Unauthorized (Token Expired/Invalid)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Only redirect if not already on login page to avoid loops (optional but good practice)
            if (!window.location.pathname.includes('/login')) {
                console.warn("Session expired or invalid token. Redirecting to login...");
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;

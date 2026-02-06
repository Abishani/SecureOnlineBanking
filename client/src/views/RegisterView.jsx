import React, { useState } from 'react';
import AuthController from '../controllers/AuthController';

const RegisterView = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        // Strong password validation
        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            setError('Password must contain uppercase, lowercase, and number');
            return;
        }

        const result = await AuthController.handleRegister(email, password);

        if (result.token) {
            setMessage('Registration Successful! Redirecting...');
            setTimeout(() => {
                // Auto login (store token) handled by controller? No, controller returns data.
                // We should probably save it or just redirect to login.
                // For simplicity, let's redirect to dashboard if token present, or login.
                // AuthController.handleRegister returns the user object with token usually.
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result));
                window.location.href = '/dashboard';
            }, 1000);
        } else if (result.error) {
            setError(result.error);
        } else if (result.message) {
            setError(result.message);
        } else {
            // Fallback
            localStorage.setItem('token', result.token); // If success w/o error
            localStorage.setItem('user', JSON.stringify(result));
            window.location.href = '/dashboard';
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2>Create Account</h2>
                {error && <div style={styles.error}>{error}</div>}
                {message && <div style={styles.success}>{message}</div>}
                <form onSubmit={handleSubmit}>
                    <div style={styles.group}>
                        <label>Email:</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={styles.input}
                        />
                    </div>
                    <div style={styles.group}>
                        <label>Password:</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={styles.input}
                        />
                    </div>
                    <button type="submit" style={styles.button}>Register</button>
                </form>
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <a href="/login" style={{ color: '#007bff' }}>Already have an account? Login</a>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' },
    card: { padding: '2rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '350px' },
    group: { marginBottom: '1rem' },
    input: { width: '100%', padding: '0.5rem', marginTop: '0.25rem' },
    button: { width: '100%', padding: '0.75rem', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    error: { color: 'red', marginBottom: '1rem' },
    success: { color: 'green', marginBottom: '1rem' }
};

export default RegisterView;

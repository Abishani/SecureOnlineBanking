import React, { useState } from 'react';
import AuthController from '../controllers/AuthController';

const LoginView = () => {
    const [email, setEmail] = useState('demo@example.com');
    const [password, setPassword] = useState('password123');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        const result = await AuthController.handleLogin(email, password);

        if (result.success) {
            setMessage('Login Successful! Redirecting...');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        } else {
            setError(result.error);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2>Secure Banking Login</h2>
                {error && <div style={styles.error}>{error}</div>}
                {message && <div style={styles.success}>{message}</div>}
                <form onSubmit={handleSubmit}>
                    <div style={styles.group}>
                        <label>Email:</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={styles.input}
                        />
                    </div>
                    <div style={styles.group}>
                        <label>Password:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={styles.input}
                        />
                    </div>
                    <button type="submit" style={styles.button}>Login</button>
                </form>
            </div>
        </div>
    );
};

const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' },
    card: { padding: '2rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '350px' },
    group: { marginBottom: '1rem' },
    input: { width: '100%', padding: '0.5rem', marginTop: '0.25rem' },
    button: { width: '100%', padding: '0.75rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    error: { color: 'red', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#ffd7d7', borderRadius: '4px' },
    success: { color: 'green', marginBottom: '1rem' }
};

export default LoginView;

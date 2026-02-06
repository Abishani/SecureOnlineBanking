import React, { useState } from 'react';
import AuthController from '../controllers/AuthController';

const LoginView = () => {
    const [email, setEmail] = useState('demo@example.com');
    const [password, setPassword] = useState('password123');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // Simulation State
    const [showSim, setShowSim] = useState(false);
    const [mockIp, setMockIp] = useState('');
    const [mockCountry, setMockCountry] = useState('');
    const [mockUserAgent, setMockUserAgent] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        const result = await AuthController.handleLogin(email, password, { mockIp, mockCountry, mockUserAgent });

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

                    {/* Cyber Attack Simulation Controls */}
                    <div style={{ marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                        <div
                            style={{ cursor: 'pointer', color: '#dc3545', fontWeight: 'bold', marginBottom: '0.5rem' }}
                            onClick={() => setShowSim(!showSim)}
                        >
                            {showSim ? '▼ Hide Cyber Attack Tools' : '▶ Show Cyber Attack Tools'}
                        </div>
                        {showSim && (
                            <div style={{ backgroundColor: '#fff5f5', padding: '0.5rem', borderRadius: '4px' }}>
                                <small style={{ display: 'block', marginBottom: '0.5rem', color: '#666' }}>Simulate Fraud Signals:</small>
                                <input placeholder="Spoof IP (e.g. 1.2.3.4)" style={styles.input} onChange={e => setMockIp(e.target.value)} />
                                <input placeholder="Spoof Country (e.g. CN, RU)" style={styles.input} onChange={e => setMockCountry(e.target.value)} />
                                <input placeholder="Spoof User-Agent (Target Device)" style={styles.input} onChange={e => setMockUserAgent(e.target.value)} />
                            </div>
                        )}
                    </div>
                </form>
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <a href="/register" style={{ color: '#007bff' }}>New User? Register here</a>
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
    button: { width: '100%', padding: '0.75rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    error: { color: 'red', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#ffd7d7', borderRadius: '4px' },
    success: { color: 'green', marginBottom: '1rem' }
};

export default LoginView;

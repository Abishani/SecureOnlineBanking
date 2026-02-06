import React, { useState } from 'react';
import AuthController from '../controllers/AuthController';

const LoginView = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [mfaRequired, setMfaRequired] = useState(false);
    const [mfaToken, setMfaToken] = useState('');
    const [tempUserId, setTempUserId] = useState('');



    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        // Client-side validation
        if (!email || !password) {
            setError('Email and password are required');
            return;
        }

        const result = await AuthController.handleLogin(email, password);

        if (result.success) {
            setMessage('Login Successful! Redirecting...');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        } else if (result.mfaRequired) {
            setMfaRequired(true);
            setTempUserId(result.userId);
            setMessage('');
            setError('');
        } else {
            setError(result.error);
        }
    };

    const handleMfaSubmit = async (e) => {
        e.preventDefault();
        const result = await AuthController.verifyMFA(tempUserId, mfaToken.replace(/\s+/g, ''));
        if (result.success) {
            setMessage('MFA Verified! Redirecting...');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        } else {
            setError(result.error || 'Invalid Code');
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2>Secure Banking Login</h2>
                {error && <div style={styles.error}>{error}</div>}
                {message && <div style={styles.success}>{message}</div>}
                <form onSubmit={mfaRequired ? handleMfaSubmit : handleSubmit}>
                    {!mfaRequired ? (
                        <>
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
                        </>
                    ) : (
                        <>
                            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                <p><strong>Two-Factor Authentication Required</strong></p>
                                <p>Please enter the code from your Authenticator App.</p>
                            </div>
                            <div style={styles.group}>
                                <label>MFA Code:</label>
                                <input
                                    type="text"
                                    value={mfaToken}
                                    onChange={(e) => setMfaToken(e.target.value)}
                                    placeholder="000000"
                                    style={{ ...styles.input, textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem' }}
                                    autoFocus
                                />
                            </div>
                            <button type="submit" style={styles.button}>Verify Code</button>
                            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                                <span
                                    style={{ color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
                                    onClick={() => setMfaRequired(false)}
                                >
                                    Back to Login
                                </span>
                            </div>
                        </>
                    )}


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

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

    const [useRecovery, setUseRecovery] = useState(false);

    const handleMfaSubmit = async (e) => {
        e.preventDefault();
        const result = await AuthController.verifyMFA(tempUserId, mfaToken.replace(/\s+/g, ''));
        if (result.success) {
            setMessage(result.message || 'MFA Verified! Redirecting...');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        } else {
            setError(result.error || 'Invalid Code');
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="glass-container animate-fade-in" style={{ width: '400px', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '1.5rem' }}>Secure Banking Login</h2>

                {error && <div style={{ color: '#ff6b6b', background: 'rgba(255,0,0,0.1)', padding: '10px', borderRadius: '5px', marginBottom: '1rem' }}>{error}</div>}
                {message && <div style={{ color: '#51cf66', background: 'rgba(0,255,0,0.1)', padding: '10px', borderRadius: '5px', marginBottom: '1rem' }}>{message}</div>}

                <form onSubmit={mfaRequired ? handleMfaSubmit : handleSubmit}>
                    {!mfaRequired ? (
                        <>
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="glass-input"
                                required
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="glass-input"
                                required
                            />
                            <button type="submit" className="glass-button">Secure Login</button>
                        </>
                    ) : (
                        <>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <p><strong>Two-Factor Authentication</strong></p>
                                <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                                    {useRecovery ? 'Enter one of your recovery codes.' : 'Enter the code from your Authenticator App.'}
                                </p>
                            </div>

                            <input
                                type="text"
                                value={mfaToken}
                                onChange={(e) => setMfaToken(e.target.value)}
                                placeholder={useRecovery ? "Recovery Code (10 chars)" : "000 000"}
                                className="glass-input"
                                style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem' }}
                                autoFocus
                                required
                            />

                            <button type="submit" className="glass-button">Verify {useRecovery ? 'Recovery Code' : 'Token'}</button>

                            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <span
                                    style={{ color: '#a5d8ff', cursor: 'pointer', fontSize: '0.9rem' }}
                                    onClick={() => {
                                        setUseRecovery(!useRecovery);
                                        setMfaToken('');
                                        setError('');
                                    }}
                                >
                                    {useRecovery ? 'Use Authenticator App' : 'Lost your phone? Use Recovery Code'}
                                </span>

                                <span
                                    style={{ color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.8rem' }}
                                    onClick={() => {
                                        setMfaRequired(false);
                                        setUseRecovery(false);
                                        setMfaToken('');
                                        setError('');
                                    }}
                                >
                                    Cancel Login
                                </span>
                            </div>
                        </>
                    )}
                </form>

                {!mfaRequired && (
                    <div style={{ marginTop: '1.5rem' }}>
                        <a href="/register" style={{ color: '#a5d8ff', textDecoration: 'none' }}>New User? Register here</a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginView;

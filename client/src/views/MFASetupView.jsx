import React, { useState, useEffect } from 'react';
import AuthController from '../controllers/AuthController';

const MFASetupView = () => {
    const [qrCode, setQrCode] = useState('');
    const [message, setMessage] = useState('');
    const [secret, setSecret] = useState('');
    const [recoveryCodes, setRecoveryCodes] = useState([]);

    useEffect(() => {
        const setup = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setMessage("Error: Please login first");
                return;
            }

            const result = await AuthController.setupMFA();
            if (result.success) {
                setQrCode(result.data.qrCode);
                setSecret(result.data.secret);
                setRecoveryCodes(result.data.recoveryCodes || []);
            } else {
                console.error("MFA Setup Failed:", result.error);
                setMessage(result.error || 'Error generating MFA');
            }
        };
        setup();
    }, []);

    const handleVerify = async (e) => {
        e.preventDefault();
        const token = e.target.token.value.replace(/\s+/g, '');
        const user = JSON.parse(localStorage.getItem('user'));
        const result = await AuthController.verifyMFA(user._id, token);
        if (result.success) {
            setMessage('MFA Enabled Successfully!');
            setTimeout(() => window.location.href = '/dashboard', 1500);
        } else {
            setMessage('Invalid Code. Try again.');
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="glass-container animate-fade-in" style={{ width: '500px', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '1rem' }}>Setup 2FA</h2>
                <div style={{ textAlign: 'left', marginBottom: '1rem', fontSize: '0.9rem', color: '#ccc' }}>
                    1. Scan this QR code with <strong>Google Authenticator</strong> or <strong>Microsoft Authenticator</strong>.
                </div>

                {qrCode ? (
                    <div style={{ background: 'white', padding: '10px', display: 'inline-block', borderRadius: '8px', marginBottom: '1rem' }}>
                        <img src={qrCode} alt="2FA QR Code" width="150" />
                    </div>
                ) : <p>Loading...</p>}

                {secret && <p style={{ fontSize: '12px', fontFamily: 'monospace', color: '#a5d8ff', marginBottom: '1rem' }}>Secret: {secret}</p>}

                {recoveryCodes.length > 0 && (
                    <div style={{ textAlign: 'left', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                        <div style={{ color: '#ffc107', fontWeight: 'bold', marginBottom: '0.5rem' }}>⚠️ SAVE THESE RECOVERY CODES</div>
                        <p style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>If you lose your device, use these codes to log in. Each code can be used once.</p>
                        <div className="code-display">
                            {recoveryCodes.map((code, i) => (
                                <div key={i}>{code}</div>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ textAlign: 'left', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#ccc' }}>
                    2. Enter the 6-digit code from the app to verify.
                </div>

                <form onSubmit={handleVerify}>
                    <input
                        name="token"
                        placeholder="000 000"
                        className="glass-input"
                        style={{ textAlign: 'center', letterSpacing: '2px', fontSize: '1.2rem' }}
                        autoComplete="off"
                    />
                    <button type="submit" className="glass-button">Verify & Enable</button>
                </form>

                {message && <div style={{ marginTop: '1rem', color: message.includes('Success') ? '#51cf66' : '#ff6b6b' }}>{message}</div>}

                <div style={{ marginTop: '1rem' }}>
                    <a href="/dashboard" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Cancel</a>
                </div>
            </div>
        </div>
    );
};

export default MFASetupView;

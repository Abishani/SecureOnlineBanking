import React, { useState, useEffect } from 'react';
import AuthController from '../controllers/AuthController';

const MFASetupView = () => {
    const [qrCode, setQrCode] = useState('');
    const [message, setMessage] = useState('');
    const [secret, setSecret] = useState('');

    useEffect(() => {
        const setup = async () => {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) {
                setMessage("Error: User not logged in (No user in localStorage). Please Logout and Login.");
                return;
            }
            // In real app, don't pass ID from client blindly, use token check in backend
            console.log("Setting up MFA for User ID:", user._id);
            const result = await AuthController.setupMFA(user._id);
            if (result.success) {
                setQrCode(result.data.qrCode);
                setSecret(result.data.secret);
                setSecret(result.data.secret);
            } else {
                console.error("MFA Setup Failed:", result.error);
                setMessage(result.error || 'Error generating MFA');
            }
        };
        setup();
    }, []);

    const handleVerify = async (e) => {
        e.preventDefault();
        const token = e.target.token.value;
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
        <div style={styles.container}>
            <div style={styles.card}>
                <h2>Setup 2FA</h2>
                <p>Scan this QR code with your Authenticator App (Google/Microsoft Auth).</p>
                {qrCode ? (
                    <div style={{ textAlign: 'center' }}>
                        <img src={qrCode} alt="2FA QR Code" />
                        <p style={{ fontSize: '12px' }}>Secret: {secret}</p>
                    </div>
                ) : <p>Loading QR...</p>}

                <form onSubmit={handleVerify}>
                    <input name="token" placeholder="Enter 6-digit Code" style={styles.input} />
                    <button type="submit" style={styles.button}>Verify & Enable</button>
                </form>
                {message && <p style={styles.success}>{message}</p>}
            </div>
        </div>
    );
};

const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' },
    card: { padding: '2rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '400px', textAlign: 'center' },
    input: { width: '80%', padding: '0.5rem', margin: '1rem 0' },
    button: { width: '100%', padding: '0.75rem', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    success: { color: 'red', marginTop: '1rem', fontWeight: 'bold' }
};

export default MFASetupView;

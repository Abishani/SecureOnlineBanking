import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './toggle.css';
import LoginView from './views/LoginView';
import RegisterView from './views/RegisterView';
import MFASetupView from './views/MFASetupView';
import TransactionView from './views/TransactionView';

const Dashboard = () => {
    const user = JSON.parse(localStorage.getItem('user'));

    // Handle logout
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    const disableMFA = async () => {
        if (window.confirm('Are you sure you want to disable 2FA?')) {
            const importAuthController = require('./controllers/AuthController').default;
            const result = await importAuthController.disableMFA();
            if (result.success) {
                alert('MFA Disabled');
                window.location.reload();
            } else {
                alert(result.error);
            }
        }
    };

    if (!user) return <Navigate to="/login" />;

    return (
        <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
            <h1>Welcome, {user.email}</h1>
            <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px', marginBottom: '1rem' }}>
                <h3>Security Status</h3>
                <p><strong>Risk Score (Last Login):</strong> {user.riskAnalysis ? user.riskAnalysis.riskScore : '0'}</p>
                <p><strong>Status:</strong> {user.riskAnalysis ? user.riskAnalysis.action : 'SAFE'}</p>
                {user.riskAnalysis && user.riskAnalysis.triggeredRules && (
                    <p style={{ color: 'orange' }}><strong>Flags:</strong> {user.riskAnalysis.triggeredRules.join(', ')}</p>
                )}
            </div>

            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div style={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3>Two-Factor Authentication</h3>
                            <p style={{ margin: '0.5rem 0', color: '#666' }}>
                                {user.mfaEnabled
                                    ? 'On - Your account is secure.'
                                    : 'Off - Enable to protect your account.'}
                            </p>
                        </div>
                        <label style={styles.switch}>
                            <input
                                type="checkbox"
                                checked={user.mfaEnabled}
                                onChange={user.mfaEnabled ? disableMFA : () => window.location.href = '/mfa-setup'}
                            />
                            <span style={styles.slider}></span>
                        </label>
                    </div>
                </div>

                <a href="/transactions" style={styles.cardLink}>
                    <div style={{ ...styles.card, borderColor: '#007bff' }}>
                        <h3>💰 Send Money</h3>
                        <p>Transfer funds securely</p>
                    </div>
                </a>
            </div>

            <button onClick={logout} style={styles.logoutBtn}>Logout</button>
        </div>
    );
};

const styles = {
    cardLink: { textDecoration: 'none', color: 'inherit' },
    card: { padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: 'white', marginBottom: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
    logoutBtn: { marginTop: '2rem', padding: '0.5rem 1rem', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    switch: {
        position: 'relative',
        display: 'inline-block',
        width: '60px',
        height: '34px',
    },
    slider: {
        position: 'absolute',
        cursor: 'pointer',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#ccc',
        transition: '.4s',
        borderRadius: '34px',
    }
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginView />} />
                <Route path="/register" element={<RegisterView />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/mfa-setup" element={<MFASetupView />} />
                <Route path="/transactions" element={<TransactionView />} />
                <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}

export default App;

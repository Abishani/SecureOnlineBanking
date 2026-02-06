import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
                {!user.mfaEnabled && (
                    <a href="/mfa-setup" style={styles.cardLink}>
                        <div style={{ ...styles.card, borderColor: 'red' }}>
                            <h3>⚠️ Enable 2FA</h3>
                            <p>Secure your account now</p>
                        </div>
                    </a>
                )}

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
    card: { padding: '1.5rem', border: '2px solid #ddd', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'white' },
    logoutBtn: { marginTop: '2rem', padding: '0.5rem 1rem', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }
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

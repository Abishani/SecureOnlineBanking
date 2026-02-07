import React from 'react';
import { Navigate } from 'react-router-dom';

const DashboardView = () => {
    const user = JSON.parse(localStorage.getItem('user'));

    // Handle logout
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    const disableMFA = async () => {
        if (window.confirm('Are you sure you want to disable 2FA? This will reduce your account security.')) {
            const importAuthController = require('../controllers/AuthController').default;
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

    // Mock Geo-location for visualization
    const lastLoginLocation = user.riskAnalysis?.triggeredRules?.includes('UNUSUAL_LOCATION')
        ? 'Unknown / Suspicious'
        : 'United States (Approx)';

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', marginBottom: '2rem' }}>
                <h1>Welcome, {user.email.split('@')[0]}</h1>
                <button onClick={logout} className="glass-button secondary" style={{ width: 'auto' }}>Logout</button>
            </div>

            <div className="dashboard-grid">
                {/* Security Status Card */}
                <div className="glass-container stat-card">
                    <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                        🛡️ Security Overview
                    </h3>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>Current Risk Score:</span>
                        <span style={{
                            fontWeight: 'bold',
                            color: (user.riskAnalysis?.riskScore || 0) > 0.5 ? '#ff6b6b' : '#51cf66'
                        }}>
                            {Math.round((user.riskAnalysis?.riskScore || 0) * 100)}/100
                        </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>Account Status:</span>
                        <span>{user.riskAnalysis?.action || 'ACTIVE'}</span>
                    </div>

                    <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#ccc' }}>
                        <strong>Last Login Analysis:</strong>
                        <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
                            <li>IP Address: {user.riskAnalysis?.ip || 'Verified'}</li>
                            <li>Device: {user.riskAnalysis?.userAgent ? 'Adding to trusted list...' : 'Verified'}</li>
                            <li>Location: {lastLoginLocation}</li>
                        </ul>
                    </div>

                    {user.riskAnalysis?.triggeredRules && user.riskAnalysis.triggeredRules.length > 0 && (
                        <div style={{ marginTop: '1rem', background: 'rgba(220, 53, 69, 0.2)', padding: '0.5rem', borderRadius: '4px' }}>
                            <strong>⚠️ Alerts:</strong> {user.riskAnalysis.triggeredRules.join(', ')}
                        </div>
                    )}
                </div>

                {/* MFA Settings Card */}
                <div className="glass-container stat-card">
                    <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                        🔐 Authentication Settings
                    </h3>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div>
                            <div style={{ fontWeight: 'bold' }}>Two-Factor Authentication</div>
                            <div style={{ fontSize: '0.8rem', color: '#ccc', marginTop: '0.2rem' }}>
                                {user.mfaEnabled
                                    ? 'Enabled. Your account is protected.'
                                    : 'Disabled. High security risk.'}
                            </div>
                        </div>

                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={user.mfaEnabled}
                                onChange={user.mfaEnabled ? disableMFA : () => window.location.href = '/mfa-setup'}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>

                    {user.mfaEnabled && (
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Backup Methods</div>
                            <button className="glass-button secondary" onClick={() => alert('Feature coming soon: View Recovery Codes')}>
                                View Recovery Codes
                            </button>
                        </div>
                    )}
                </div>

                {/* Transactions / Actions Card */}
                <div className="glass-container stat-card">
                    <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                        💳 Quick Actions
                    </h3>

                    <div style={{ display: 'grid', gap: '10px' }}>
                        <button className="glass-button" onClick={() => window.location.href = '/transactions'}>
                            Transfer Funds
                        </button>
                        <button className="glass-button secondary">
                            View Statements
                        </button>
                        <button className="glass-button secondary">
                            Manage Cards
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;

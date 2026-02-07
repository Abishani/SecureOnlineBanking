import React from 'react';

const AuthTab = ({ user, disableMFA }) => {
    return (
        <div className="glass-container animate-fade-in" style={{ flex: 1 }}>
            <h2 style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '1rem', marginBottom: '2rem' }}>
                🔐 Authentication Settings
            </h2>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Two-Factor Authentication (2FA)</div>
                        <div style={{ color: '#ccc' }}>
                            {user.mfaEnabled
                                ? '✅ Enabled. Your account is protected.'
                                : '⚠️ Disabled. We recommend enabling this for higher security.'}
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
            </div>

            {user.mfaEnabled && (
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Backup Methods</h3>
                    <p style={{ color: '#ccc', marginBottom: '1.5rem' }}>
                        If you lose access to your authenticator app, you can use recovery codes to log in.
                    </p>
                    <button className="glass-button secondary" onClick={() => alert('Feature coming soon: View Recovery Codes')}>
                        View Recovery Codes
                    </button>
                </div>
            )}
        </div>
    );
};

export default AuthTab;

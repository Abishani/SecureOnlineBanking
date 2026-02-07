import React, { useState } from 'react';

const AuthTab = ({ user, disableMFA }) => {
    const [recoveryCodes, setRecoveryCodes] = useState([]);
    const [showCodes, setShowCodes] = useState(false);
    const [error, setError] = useState('');

    const handleRegenerateCodes = async () => {
        if (window.confirm("Are you sure? This will invalidate any old recovery codes.")) {
            const importAuthController = require('../../controllers/AuthController').default;
            const result = await importAuthController.regenerateRecoveryCodes();
            if (result.success) {
                setRecoveryCodes(result.codes);
                setShowCodes(true);
                setError('');
            } else {
                setError(result.error);
            }
        }
    };

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
                        <br />
                        <span style={{ color: '#ffc107', fontSize: '0.9rem' }}>Note: Regenerating codes will invalidate previous ones.</span>
                    </p>

                    {!showCodes ? (
                        <button className="glass-button secondary" onClick={handleRegenerateCodes}>
                            🔄 Regenerate Recovery Codes
                        </button>
                    ) : (
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', animation: 'fadeIn 0.5s' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <strong style={{ color: '#51cf66' }}>New Recovery Codes Generated</strong>
                                <button className="glass-button secondary" style={{ width: 'auto', padding: '5px 10px', fontSize: '0.8rem' }} onClick={() => setShowCodes(false)}>Close</button>
                            </div>
                            <div className="code-display" style={{ gridTemplateColumns: '1fr', textAlign: 'center' }}>
                                {recoveryCodes.map((code, i) => (
                                    <div key={i} style={{ padding: '5px', letterSpacing: '2px' }}>{code}</div>
                                ))}
                            </div>
                            <div style={{ color: '#ff6b6b', fontSize: '0.9rem', marginTop: '0.5rem', textAlign: 'center' }}>
                                ⚠️ Save these codes now! They will not be shown again.
                            </div>
                        </div>
                    )}
                    {error && <div style={{ color: '#ff6b6b', marginTop: '1rem' }}>{error}</div>}
                </div>
            )}
        </div>
    );
};

export default AuthTab;

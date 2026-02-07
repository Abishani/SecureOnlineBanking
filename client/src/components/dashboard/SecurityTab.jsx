import React from 'react';

const SecurityTab = ({ user }) => {
    // Mock Geo-location for visualization
    const lastLoginLocation = user.riskAnalysis?.triggeredRules?.includes('UNUSUAL_LOCATION')
        ? 'Unknown / Suspicious'
        : 'United States (Approx)';

    return (
        <div className="glass-container animate-fade-in" style={{ flex: 1 }}>
            <h2 style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '1rem', marginBottom: '2rem' }}>
                🛡️ Security Overview
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ color: '#ccc', marginBottom: '0.5rem' }}>Current Risk Score</div>
                        <div style={{
                            fontSize: '2.5rem',
                            fontWeight: 'bold',
                            color: (user.riskAnalysis?.riskScore || 0) > 0.5 ? '#ff6b6b' : '#51cf66'
                        }}>
                            {Math.round((user.riskAnalysis?.riskScore || 0) * 100)}<span style={{ fontSize: '1rem', color: '#ccc' }}>/100</span>
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ color: '#ccc', marginBottom: '0.5rem' }}>Account Status</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                            {user.riskAnalysis?.action || 'ACTIVE'}
                        </div>
                    </div>
                </div>

                <div>
                    <div style={{ color: '#ccc', marginBottom: '1rem' }}>Last Login Analysis</div>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <strong>IP Address:</strong> {user.riskAnalysis?.ip || 'Verified'}
                        </li>
                        <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <strong>Device:</strong> {user.riskAnalysis?.userAgent ? 'Adding to trusted list...' : 'Verified'}
                        </li>
                        <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <strong>Location:</strong> {lastLoginLocation}
                        </li>
                    </ul>

                    {user.riskAnalysis?.triggeredRules && user.riskAnalysis.triggeredRules.length > 0 && (
                        <div style={{ marginTop: '1rem', background: 'rgba(220, 53, 69, 0.2)', padding: '1rem', borderRadius: '8px' }}>
                            <strong>⚠️ Alerts:</strong> {user.riskAnalysis.triggeredRules.join(', ')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SecurityTab;

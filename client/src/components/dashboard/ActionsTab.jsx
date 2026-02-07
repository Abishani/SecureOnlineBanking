import React from 'react';

const ActionsTab = () => {
    return (
        <div className="glass-container animate-fade-in" style={{ flex: 1 }}>
            <h2 style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '1rem', marginBottom: '2rem' }}>
                💳 Quick Actions
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div
                    className="glass-button"
                    style={{ height: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => window.location.href = '/transactions'}
                >
                    <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>💸</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Transfer Funds</span>
                </div>

                <div className="glass-button secondary" style={{ height: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', opacity: 0.7 }}>
                    <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>View Statements</span>
                </div>

                <div className="glass-button secondary" style={{ height: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', opacity: 0.7 }}>
                    <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>💳</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Manage Cards</span>
                </div>
            </div>
        </div>
    );
};

export default ActionsTab;

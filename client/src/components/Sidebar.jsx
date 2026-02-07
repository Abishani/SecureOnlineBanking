import React from 'react';

const Sidebar = ({ activeTab, setActiveTab, logout }) => {
    const menuItems = [
        { id: 'security', label: '🛡️ Security Overview' },
        { id: 'auth', label: '🔐 Authentication' },
        { id: 'actions', label: '💳 Quick Actions' }
    ];

    return (
        <div className="glass-container sidebar" style={{
            width: '250px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '1.5rem',
            marginRight: '2rem'
        }}>
            <h3 style={{ marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '1rem' }}>
                Menu
            </h3>
            <div style={{ flex: 1 }}>
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`glass-button ${activeTab === item.id ? 'active' : 'secondary'}`}
                        style={{
                            width: '100%',
                            marginBottom: '1rem',
                            textAlign: 'left',
                            justifyContent: 'flex-start',
                            backgroundColor: activeTab === item.id ? 'rgba(255, 255, 255, 0.2)' : 'transparent'
                        }}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
            <button onClick={logout} className="glass-button secondary" style={{ marginTop: 'auto', background: 'rgba(220, 53, 69, 0.2)' }}>
                🚪 Logout
            </button>
        </div>
    );
};

export default Sidebar;

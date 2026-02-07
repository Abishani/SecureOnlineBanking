import React from 'react';

const Sidebar = ({ activeTab, setActiveTab, logout }) => {
    const menuItems = [
        { id: 'security', label: '🛡️ Security Overview' },
        { id: 'auth', label: '🔐 Authentication' },
        { id: 'actions', label: '💳 Quick Actions' }
    ];

    return (
        <div className="glass-container sidebar">
            <h3>Menu</h3>
            <div className="sidebar-menu">
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
            <button onClick={logout} className="glass-button sidebar-logout">
                🚪 Logout
            </button>
        </div>
    );
};

export default Sidebar;

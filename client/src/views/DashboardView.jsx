import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import SecurityTab from '../components/dashboard/SecurityTab';
import AuthTab from '../components/dashboard/AuthTab';
import ActionsTab from '../components/dashboard/ActionsTab';

const DashboardView = () => {
    const [activeTab, setActiveTab] = useState('security');
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

    const renderContent = () => {
        switch (activeTab) {
            case 'security':
                return <SecurityTab user={user} />;
            case 'auth':
                return <AuthTab user={user} disableMFA={disableMFA} />;
            case 'actions':
                return <ActionsTab />;
            default:
                return <SecurityTab user={user} />;
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', padding: '2rem', boxSizing: 'border-box' }}>
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} logout={logout} />

            <div style={{ flex: 1, overflowY: 'auto', paddingLeft: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', marginBottom: '2rem' }}>
                    <h1>Welcome, {user.email.split('@')[0]}</h1>
                </div>

                {renderContent()}
            </div>
        </div>
    );
};

export default DashboardView;

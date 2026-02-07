import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LoginView from './views/LoginView';
import RegisterView from './views/RegisterView';
import MFASetupView from './views/MFASetupView';
import TransactionView from './views/TransactionView';
import DashboardView from './views/DashboardView';


function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginView />} />
                <Route path="/register" element={<RegisterView />} />
                <Route path="/dashboard" element={<DashboardView />} />
                <Route path="/mfa-setup" element={<MFASetupView />} />
                <Route path="/transactions" element={<TransactionView />} />
                <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}

export default App;

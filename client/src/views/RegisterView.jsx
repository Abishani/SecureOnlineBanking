import React, { useState } from 'react';
import AuthController from '../controllers/AuthController';

const RegisterView = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        // Strong password validation
        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            setError('Password must contain uppercase, lowercase, and number');
            return;
        }

        const result = await AuthController.handleRegister(email, password);

        if (result.success) {
            setMessage('Registration Successful! Redirecting...');
            setTimeout(() => {
                // Token and User are already saving in AuthModel.js
                window.location.href = '/dashboard';
            }, 1000);
        } else {
            setError(result.error || 'Registration failed');
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="glass-container animate-fade-in" style={{ width: '400px', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '1.5rem' }}>Create Account</h2>

                {error && <div style={{ color: '#ff6b6b', background: 'rgba(255,0,0,0.1)', padding: '10px', borderRadius: '5px', marginBottom: '1rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Email Address"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="glass-input"
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="glass-input"
                    />

                    <button type="submit" className="glass-button">Register</button>
                </form>

                <div style={{ marginTop: '1.5rem' }}>
                    <a href="/login" style={{ color: '#a5d8ff', textDecoration: 'none' }}>Already have an account? Login</a>
                </div>
            </div>
        </div>
    );
};

export default RegisterView;

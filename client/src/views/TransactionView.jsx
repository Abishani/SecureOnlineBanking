import React, { useState, useEffect } from 'react';
import TransactionController from '../controllers/TransactionController';

const TransactionView = () => {
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    const [history, setHistory] = useState([]);

    // Get user from local storage
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        if (user) {
            loadHistory();
        }
    }, []);

    const loadHistory = async () => {
        const result = await TransactionController.getTransactions(user._id);
        if (result.success) {
            setHistory(result.data);
        }
    };

    const handleTransaction = async (e) => {
        e.preventDefault();
        setMessage('Processing...');

        const result = await TransactionController.sendMoney(user._id, recipient, amount);

        if (result.success) {
            setMessage('Transaction Successful! 💸');
            setRecipient('');
            setAmount('');
            loadHistory(); // Refresh list
        } else {
            if (result.risk && result.risk.action === 'BLOCK') {
                setMessage(`BLOCKED: ${result.error}. Risk Score: ${result.risk.riskScore}`);
            } else if (result.risk && result.risk.action === 'FLAG') {
                // In real app, prompt for MFA here
                setMessage(`FLAGGED: Transaction under review. Risk Score: ${result.risk.riskScore}`);
            } else {
                setMessage(`Error: ${result.error}`);
            }
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2>Send Money</h2>
                <form onSubmit={handleTransaction}>
                    <input
                        placeholder="Recipient Email/ID"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        style={styles.input}
                    />
                    <input
                        type="number"
                        placeholder="Amount ($)"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        style={styles.input}
                    />
                    <button type="submit" style={styles.button}>Send</button>
                </form>
                {message && <p style={styles.msg}>{message}</p>}

                <h3>Recent Transactions</h3>
                <ul style={styles.list}>
                    {history.map(tx => (
                        <li key={tx._id} style={{ ...styles.item, color: tx.fraudCheck === 'BLOCK' ? 'red' : 'green' }}>
                            To: {tx.toAccount} | ${tx.amount} | Status: {tx.fraudCheck}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '2rem' },
    card: { backgroundColor: 'white', padding: '2rem', borderRadius: '8px', maxWidth: '600px', margin: 'auto' },
    input: { display: 'block', width: '100%', marginBottom: '1rem', padding: '0.5rem' },
    button: { padding: '0.5rem 1rem', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none' },
    msg: { marginTop: '1rem', fontWeight: 'bold' },
    list: { listStyle: 'none', padding: 0 },
    item: { borderBottom: '1px solid #eee', padding: '0.5rem 0' }
};

export default TransactionView;

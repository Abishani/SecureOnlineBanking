const express = require('express');
const router = express.Router();
const validator = require('validator');
const { protect } = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const FraudEngine = require('../fraud/FraudEngine');
const rules = require('../fraud/rules');

// @route   POST /api/transactions
// @desc    Create a new transaction
router.post('/', protect, async (req, res) => {
    const { amount, recipient } = req.body;
    const userId = req.user._id;

    try {
        // Input validation
        if (!amount || !recipient) {
            return res.status(400).json({ message: 'Amount and recipient are required' });
        }

        const numAmount = Number(amount);
        if (isNaN(numAmount) || numAmount <= 0 || numAmount > 1000000) {
            return res.status(400).json({ message: 'Invalid amount' });
        }

        if (!validator.isEmail(recipient)) {
            return res.status(400).json({ message: 'Invalid recipient email' });
        }


        let fraudRisk = 0;
        const flags = [];
 
        const isBlocked = fraudRisk >= 0.7;

        const transaction = await Transaction.create({
            userId,
            amount,
            recipient,
            status: isBlocked ? 'BLOCKED' : 'COMPLETED',
            fraudCheck: {
                passed: !isBlocked,
                riskScore: fraudRisk,
                flags
            }
        });

        // Update Average Transaction Amount
        if (!isBlocked) {
            const user = await User.findById(userId);
            const oldAvg = user.averageTransactionAmount || 0;
            user.averageTransactionAmount = (oldAvg + Number(amount)) / 2;
            await user.save();
        }

        if (isBlocked) {
            return res.status(403).json({ message: 'Transaction blocked due to fraud risk', transaction });
        }

        res.status(201).json(transaction);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Transaction failed' });
    }
});

// @route   GET /api/transactions
// @desc    Get user transactions
router.get('/', protect, async (req, res) => {
    const transactions = await Transaction.find({ userId: req.user._id }).sort({ timestamp: -1 });
    res.json(transactions);
});

module.exports = router;

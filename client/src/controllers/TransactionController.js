import TransactionModel from '../models/TransactionModel';

class TransactionController {
    static async sendMoney(userId, recipient, amount) {
        if (!recipient || !amount || amount <= 0) {
            return { success: false, error: 'Invalid recipient or amount' };
        }

        const transactionData = {
            userId,
            recipient,
            amount: parseFloat(amount)
        };

        return await TransactionModel.createTransaction(transactionData);
    }

    static async getTransactions(userId) {
        return await TransactionModel.getHistory(userId);
    }
}

export default TransactionController;

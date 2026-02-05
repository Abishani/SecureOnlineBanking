import api from '../services/api';

class TransactionModel {
    static async createTransaction(transactionData) {
        try {
            const response = await api.post('/transactions', transactionData);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Transaction failed',
                risk: error.response?.data?.risk || null
            };
        }
    }

    static async getHistory(userId) {
        try {
            const response = await api.get(`/transactions/${userId}`);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: 'Failed to fetch history' };
        }
    }
}

export default TransactionModel;

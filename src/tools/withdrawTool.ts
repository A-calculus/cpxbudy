import { AuthenticatedClient } from '../services/authenticatedClient';
import { SessionManager } from '../services/sessionManager';

interface WithdrawResponse {
    id: string;
    userId: string;
    amount: number;
    currency: string;
    method: string;
    status: string;
    timestamp: string;
    estimatedCompletion: string;
}

export class WithdrawTool {
    private client: ReturnType<typeof AuthenticatedClient.getInstance>;
    private sessionManager: ReturnType<typeof SessionManager.getInstance>;

    constructor() {
        this.client = AuthenticatedClient.getInstance();
        this.sessionManager = SessionManager.getInstance();
    }

    async execute(email: string, amount: number, currency: string = 'USD', method: string = 'bank'): Promise<string> {
        try {
            console.log('\n=== Withdraw Tool Execution ===');
            
            const session = this.sessionManager.getSession(email);
            if (!session) {
                throw new Error('No active session found. Please log in first.');
            }

            console.log('\n=== Submitting Withdrawal ===');
            const response = await this.client.getClient(email).post<WithdrawResponse>('/api/transactions/withdraw', {
                amount,
                currency,
                method
            });

            const withdrawal = response.data;
            return `Withdrawal request submitted successfully!
Request ID: ${withdrawal.id}
Amount: ${currency} ${amount.toFixed(2)}
Method: ${method}
Status: ${withdrawal.status}
Submitted: ${new Date(withdrawal.timestamp).toLocaleString()}
Estimated Completion: ${new Date(withdrawal.estimatedCompletion).toLocaleString()}

Note: Withdrawals typically take 24-48 hours to process.`;
        } catch (error: any) {
            console.error('\n=== Withdraw Tool Error ===');
            console.error('Error:', error);
            console.error('Error Response:', error.response?.data);
            console.error('Error Status:', error.response?.status);
            
            const errorMessage = error.response?.data?.message || error.message || 'Failed to submit withdrawal';
            const errorDetails = error.response?.data?.details || '';
            const errorCode = error.response?.status || 'Unknown';
            
            throw new Error(`Failed to submit withdrawal (${errorCode}): ${errorMessage}${errorDetails ? `\nDetails: ${errorDetails}` : ''}`);
        }
    }
} 
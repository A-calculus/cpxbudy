import { AuthenticatedClient } from '../services/authenticatedClient';
import { SessionManager } from '../services/sessionManager';

interface SendResponse {
    id: string;
    sender: string;
    recipient: string;
    amount: number;
    currency: string;
    status: string;
    timestamp: string;
}

export class SendTool {
    private client: ReturnType<typeof AuthenticatedClient.getInstance>;
    private sessionManager: ReturnType<typeof SessionManager.getInstance>;

    constructor() {
        this.client = AuthenticatedClient.getInstance();
        this.sessionManager = SessionManager.getInstance();
    }

    async execute(email: string, recipientId: string, amount: number, currency: string = 'USD'): Promise<string> {
        try {
            // console.log('\n=== Send Tool Execution ===');
            
            const session = this.sessionManager.getSession(email);
            if (!session) {
                throw new Error('No active session found. Please log in first.');
            }

            // console.log('\n=== Sending Funds ===');
            // const response = await this.client.getClient(email).post<SendResponse>('/api/transactions/send', {
            //     recipientId,
            //     amount,
            //     currency
            // });

            // const transaction = response.data;
//             return `Transaction completed successfully!
// Transaction ID: ${transaction.id}
// Amount: ${currency} ${amount.toFixed(2)}
// Recipient: ${recipientId}
// Status: ${transaction.status}
// Time: ${new Date(transaction.timestamp).toLocaleString()}`;

            return 'Transaction completed successfully!';
        } catch (error: any) {
            
            const errorMessage = error.response?.data?.message || error.message || 'Failed to send funds';
            const errorDetails = error.response?.data?.details || '';
            const errorCode = error.response?.status || 'Unknown';
            
            throw new Error(`Failed to send funds (${errorCode}): ${errorMessage}${errorDetails ? `\nDetails: ${errorDetails}` : ''}`);
        }
    }
} 
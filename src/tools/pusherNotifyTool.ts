import { AuthenticatedClient } from '../services/authenticatedClient';
import { SessionManager } from '../services/sessionManager';
import Pusher from 'pusher';
import dotenv from 'dotenv';

dotenv.config();

interface DepositEvent {
    amount: string;
    currency: string;
    network: string;
    status: string;
    transactionHash?: string;
}

export class PusherNotifyTool {
    private client: ReturnType<typeof AuthenticatedClient.getInstance>;
    private sessionManager: ReturnType<typeof SessionManager.getInstance>;
    private pusherClient: Pusher | null = null;
    private bot: any; // TelegramBot instance
    private chatId: string | null = null;

    constructor(bot: any) {
        console.log('\n=== Initializing Pusher Notification Tool ===');
        this.client = AuthenticatedClient.getInstance();
        this.sessionManager = SessionManager.getInstance();
        this.bot = bot;
        console.log('Pusher Notification Tool initialized successfully');
    }

    async execute(email: string, chatId: string): Promise<string> {
        try {
            console.log('\n=== Pusher Notification Tool Execution ===');
            console.log('Parameters:', { email, chatId });
            
            console.log('\n=== Checking Session ===');
            const session = this.sessionManager.getSession(email);
            if (!session) {
                console.log('No session found for email:', email);
                return 'No active session found. Please log in first using /login command.';
            }

            const organizationId = session.user.organizationId;
            console.log('Session found:', {
                email: session.user.email,
                firstName: session.user.firstName,
                lastName: session.user.lastName,
                organizationId
            });

            this.chatId = chatId;
            await this.initializePusher(organizationId, email);
            
            return 'Successfully subscribed to deposit notifications. You will receive updates for new deposits.';
        } catch (error: any) {
            console.error('\n=== Pusher Notification Tool Error ===');
            console.error('Error:', error);
            console.error('Error Response:', error.response?.data);
            console.error('Error Status:', error.response?.status);
            console.error('Stack Trace:', error.stack);
            
            const errorMessage = error.response?.data?.message || error.message || 'Failed to setup notifications';
            const errorDetails = error.response?.data?.details || '';
            const errorCode = error.response?.status || 'Unknown';
            
            return `Failed to setup notifications (${errorCode}): ${errorMessage}${errorDetails ? `\nDetails: ${errorDetails}` : ''}`;
        }
    }

    private async initializePusher(organizationId: string, email: string): Promise<void> {
        if (this.pusherClient) {
            this.cleanup();
        }

        this.pusherClient = new Pusher({
            appId: process.env.VITE_PUSHER_APP_ID!,
            key: process.env.VITE_PUSHER_KEY!,
            secret: process.env.VITE_PUSHER_SECRET!,
            cluster: process.env.VITE_PUSHER_CLUSTER!,
            useTLS: true
        });

        // Subscribe to the organization's channel
        const channel = `private-org-${organizationId}`;
        
        // Trigger a test event to verify the connection
        try {
            await this.pusherClient.trigger(channel, 'test', {
                message: 'Test connection'
            });
            console.log('Successfully initialized Pusher client and verified connection');
        } catch (error) {
            console.error('Error initializing Pusher client:', error);
            throw error;
        }
    }

    private formatDepositMessage(data: DepositEvent): string {
        return `💰 *New Deposit Received*\n\n` +
               `Amount: ${data.amount} ${data.currency}\n` +
               `Network: ${data.network}\n` +
               `Status: ${data.status}\n` +
               (data.transactionHash ? `Transaction Hash: \`${data.transactionHash}\`` : '');
    }

    // Cleanup method to be called when needed
    cleanup(): void {
        if (this.pusherClient) {
            this.pusherClient = null;
        }
        this.chatId = null;
    }
} 
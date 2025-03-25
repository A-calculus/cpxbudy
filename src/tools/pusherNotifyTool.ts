import { AuthenticatedClient } from '../services/authenticatedClient';
import { SessionManager } from '../services/sessionManager';
import Pusher from 'pusher-js';
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
    }

    async execute(email: string, chatId: string): Promise<string> {
        try {
            const session = this.sessionManager.getSession(email);
            if (!session) {
                return 'No active session found. Please log in first using /login command.';
            }

            const organizationId = session.user.organizationId;
       
            this.chatId = chatId;
            await this.initializePusher(organizationId, email);
            
            return 'Successfully subscribed to deposit notifications. You will receive updates for new deposits.';
        } catch (error: any) {
            
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

        this.pusherClient = new Pusher(process.env.VITE_PUSHER_KEY!, {
            cluster: process.env.VITE_PUSHER_CLUSTER!,
            forceTLS: true,
            authorizer: (channel) => ({
                authorize: async (socketId, callback) => {
                    try {
                        const response = await this.client.getClient(email).post<{ auth: string }>('/api/notifications/auth', {
                            socket_id: socketId,
                            channel_name: channel.name
                        });

                        if (response.data && response.data.auth) {
                            callback(null, { auth: response.data.auth });
                        } else {
                            callback(new Error('Pusher authentication failed'), null);
                        }
                    } catch (error) {
                        console.error('Pusher authorization error:', error);
                        callback(error as Error, null);
                    }
                }
            })
        });

        const channel = this.pusherClient.subscribe(`private-org-${organizationId}`);

        channel.bind('pusher:subscription_succeeded', () => {
            console.log('Successfully subscribed to private channel');
        });

        channel.bind('pusher:subscription_error', (error: Error) => {
            console.error('Subscription error:', error);
        });

        // Bind to the deposit event
        channel.bind('deposit', (data: DepositEvent) => {
            if (this.bot && this.chatId) {
                const message = this.formatDepositMessage(data);
                this.bot.sendMessage(this.chatId, message, { parse_mode: 'Markdown' })
                    .catch((error: Error) => {
                        console.error('Error sending deposit notification:', error);
                    });
            }
        });
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
            this.pusherClient.disconnect();
            this.pusherClient = null;
        }
        this.chatId = null;
    }
} 
import { AuthenticatedClient } from '../services/authenticatedClient';
import { SessionManager } from '../services/sessionManager';

interface UserProfile {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImage: string;
    organizationId: string;
    role: string;
    status: string;
    type: string;
    relayerAddress: string;
    flags: string[];
    walletAddress: string;
    walletId: string;
    walletAccountType: string;
}

interface Account {
    id: string;
    type: string;
    currency: string;
    balance: number;
    status: string;
    createdAt: string;
    lastUpdated: string;
}

export class ProfileTool {
    private client: ReturnType<typeof AuthenticatedClient.getInstance>;
    private sessionManager: ReturnType<typeof SessionManager.getInstance>;

    constructor() {
        this.client = AuthenticatedClient.getInstance();
        this.sessionManager = SessionManager.getInstance();
    }

    async execute(email: string): Promise<string> {
        try {
            console.log('\n=== Profile Tool Execution ===');
            
            const session = this.sessionManager.getSession(email);
            if (!session) {
                throw new Error('No active session found. Please log in first.');
            }

            // Fetch user profile
            console.log('\n=== Fetching User Profile ===');
            const profileResponse = await this.client.getClient(email).get<UserProfile>('/api/auth/me');
            const profile = profileResponse.data;
            console.log(profile);

            // Fetch user accounts
            console.log('\n=== Fetching User Accounts ===');
            const accountsResponse = await this.client.getClient(email).get<Account[]>('/api/accounts');
            const accounts = accountsResponse.data;
            console.log('Accounts:', JSON.stringify(accounts, null, 2));
            

            return `Profile Information:[
Name: ${profile.firstName} ${profile.lastName}
Email: ${profile.email}
Role: ${profile.role}
Status: ${profile.status}
Wallet Address: ${profile.walletAddress}
Account Type: ${profile.walletAccountType}
Wallet Type: ${profile.walletAccountType}]

Accounts:
${JSON.stringify(accounts, null, 2)}

Note: Some sensitive information has been redacted for security purposes.`;
        } catch (error: any) {
            console.error('\n=== Profile Tool Error ===');
            console.error('Error:', error);
            console.error('Error Response:', error.response?.data);
            console.error('Error Status:', error.response?.status);
            
            const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch profile';
            const errorDetails = error.response?.data?.details || '';
            const errorCode = error.response?.status || 'Unknown';
            
            throw new Error(`Failed to fetch profile (${errorCode}): ${errorMessage}${errorDetails ? `\nDetails: ${errorDetails}` : ''}`);
        }
    }
} 
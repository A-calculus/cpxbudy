import { AuthenticatedClient } from '../services/authenticatedClient';
import { SessionManager } from '../services/sessionManager';

export class LogoutTool {
    private client: ReturnType<typeof AuthenticatedClient.getInstance>;
    private sessionManager: ReturnType<typeof SessionManager.getInstance>;

    constructor() {
        this.client = AuthenticatedClient.getInstance();
        this.sessionManager = SessionManager.getInstance();
    }

    async execute(email: string): Promise<string> {
        try {
            console.log('\n=== Logout Tool Execution ===');
            console.log('Email:', email);
            
            const session = this.sessionManager.getSession(email);
            if (!session) {
                throw new Error('No active session found. Please log in first.');
            }

            // Make the authenticated API call to logout
            await this.client.getClient(email).post('/api/auth/logout');

            // Clear the session after successful API call
            this.sessionManager.clearSession(email);

            console.log('\n=== Logout Successful ===');
            console.log('Email:', email);
            console.log('Session cleared');

            return 'Logged out successfully.';
        } catch (error: any) {
            console.error('\n=== Logout Tool Error ===');
            console.error('Error:', error);
            console.error('Error Response:', error.response?.data);
            console.error('Error Status:', error.response?.status);
            
            // If the error is due to an already expired/invalid session, still clear the local session
            if (error.response?.status === 401) {
                this.sessionManager.clearSession(email);
                return 'Session expired. Cleared local session data.';
            }
            
            const errorMessage = error.response?.data?.message || error.message || 'Logout failed';
            const errorDetails = error.response?.data?.details || '';
            const errorCode = error.response?.status || 'Unknown';
            
            throw new Error(`Logout failed (${errorCode}): ${errorMessage}${errorDetails ? `\nDetails: ${errorDetails}` : ''}`);
        }
    }
} 
import { CopperXClient } from '../services/copperxClient';
import { SessionManager } from '../services/sessionManager';

interface LoginResponse {
    scheme: string;
    accessToken: string;
    accessTokenId: string;
    expireAt: string;
    createdAt?: string;
    lastModified?: string;
    user: {
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
    };
}

export class OTPTool {
    private client: ReturnType<typeof CopperXClient.getInstance>;
    private sessionManager: ReturnType<typeof SessionManager.getInstance>;

    constructor() {
        this.client = CopperXClient.getInstance();
        this.sessionManager = SessionManager.getInstance();
    }

    async execute(credentials: { email: string, otp: string, sid: string }): Promise<string> {
        try {
            console.log('\n=== OTP Tool Execution ===');
            console.log('Email:', credentials.email);
            console.log('SID:', credentials.sid);
            console.log('OTP Length:', credentials.otp.length);

            const response = await this.client.getClient().post<LoginResponse>(
                '/api/auth/email-otp/authenticate',
                {
                    email: credentials.email.trim(),
                    otp: credentials.otp.trim(),
                    sid: credentials.sid.trim()
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('\n=== OTP Response ===');
            console.log('Response:', JSON.stringify(response.data, null, 2));

            const { user, accessToken, expireAt } = response.data;
            const now = new Date().toISOString();

            console.log('\n=== Storing Session ===');
            console.log('Created At:', now);
            console.log('Expires At:', expireAt);

            // Create a new session with all the necessary data
            this.sessionManager.createSession(user.email, {
                accessToken,
                accessTokenId: response.data.accessTokenId,
                expireAt,
                user: response.data.user,
                createdAt: now,
                lastAccessed: now
            });

            const result = `Login successful!
User: ${user.firstName} ${user.lastName}
Email: ${user.email}
Role: ${user.role}
Status: ${user.status}
Wallet Address: ${user.walletAddress}
Session Expires: ${new Date(expireAt).toLocaleString()}

Welcome back to CopperX! You can now access all platform features.`;

            console.log('\n=== OTP Tool Result ===');
            console.log(result);
            return result;
        } catch (error: any) {
            console.error('\n=== OTP Tool Error ===');
            console.error('Error:', error);
            console.error('Error Response:', error.response?.data);
            console.error('Error Status:', error.response?.status);
            
            const errorMessage = error.response?.data?.message || error.message || 'OTP verification failed';
            const errorDetails = error.response?.data?.details || '';
            const errorCode = error.response?.status || 'Unknown';
            
            throw new Error(`OTP verification failed (${errorCode}): ${errorMessage}${errorDetails ? `\nDetails: ${errorDetails}` : ''}`);
        }
    }
} 
import { CopperXClient } from '../services/copperxClient';

interface LoginInitiateResponse {
    email: string;
    sid: string;
}

export class LoginTool {
    private client: ReturnType<typeof CopperXClient.getInstance>;

    constructor() {
        this.client = CopperXClient.getInstance();
    }

    async execute(email: string): Promise<string> {
        try {

            const response = await this.client.getClient().post<LoginInitiateResponse>(
                '/api/auth/email-otp/request',
                { email: email.trim() },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );


            const result = `Login initiated successfully!
Email: ${response.data.email}
Session ID (SID): ${response.data.sid}

Please check your email for the OTP code to complete the login process.`;

            return result;
        } catch (error: any) {
            
            const errorMessage = error.response?.data?.message || error.message || 'Login initiation failed';
            const errorDetails = error.response?.data?.details || '';
            const errorCode = error.response?.status || 'Unknown';
            
            throw new Error(`Login initiation failed (${errorCode}): ${errorMessage}${errorDetails ? `\nDetails: ${errorDetails}` : ''}`);
        }
    }
} 
import axios from 'axios';
import { SessionManager } from './sessionManager';

export class AuthenticatedClient {
    private static instance: AuthenticatedClient;
    private sessionManager: ReturnType<typeof SessionManager.getInstance>;

    private constructor() {
        this.sessionManager = SessionManager.getInstance();
    }

    public static getInstance(): AuthenticatedClient {
        if (!AuthenticatedClient.instance) {
            AuthenticatedClient.instance = new AuthenticatedClient();
        }
        return AuthenticatedClient.instance;
    }

    public getClient(email: string) {
        const session = this.sessionManager.getSession(email);
        if (!session?.accessToken) {
            throw new Error('No active session found. Please log in first.');
        }

        return axios.create({
            baseURL: process.env.COPPERX_API_URL || 'https://api.copperx.io',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'Authorization': `Bearer ${session.accessToken}`
            }
        });
    }
} 
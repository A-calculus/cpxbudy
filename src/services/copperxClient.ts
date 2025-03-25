import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export class CopperXClient {
    private client: ReturnType<typeof axios.create>;
    private static instance: CopperXClient;

    private constructor() {
        const apiKey = process.env.COPPERX_API_KEY;
        const baseURL = process.env.COPPERX_API_URL || 'https://income-api.copperx.io';

        if (!apiKey) {
            throw new Error('COPPERX_API_KEY is not defined in environment variables');
        }

        this.client = axios.create({
            baseURL,
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'content-type': 'multipart/form-data'
            }
        });

        // Add response interceptor for error handling
        this.client.interceptors.response.use(
            response => response,
            error => {
                console.error('CopperX API Error:', error.response?.data || error.message);
                throw error;
            }
        );
    }

    // Singleton pattern to ensure only one instance exists
    public static getInstance(): CopperXClient {
        if (!CopperXClient.instance) {
            CopperXClient.instance = new CopperXClient();
        }
        return CopperXClient.instance;
    }

    // Get the configured axios client instance for custom requests
    public getClient(): ReturnType<typeof axios.create> {
        return this.client;
    }
} 
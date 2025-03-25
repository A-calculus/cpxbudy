import { LoginTool } from './loginTool';
import { OTPTool } from './otpTool';
import { LogoutTool } from './logoutTool';
import { BalanceTool } from './balanceTool';
import { SendTool } from './sendTool';
import { WithdrawTool } from './withdrawTool';
import { ProfileTool } from './profileTool';
import { KYCTool } from './kycTool';
import { WalletTool } from './walletTool';
import { PusherNotifyTool } from './pusherNotifyTool';
import fs from 'fs';
import path from 'path';
import { AuthenticatedClient } from '../services/authenticatedClient';
import { SessionManager } from '../services/sessionManager';

export class ToolManager {
    private static instance: ToolManager;
    private tools: Map<string, any>;
    private prompts: Map<string, string>;
    private kycTool: KYCTool;
    private bot: any;

    private constructor(bot: any) {
        this.bot = bot;
        this.tools = new Map();
        this.prompts = new Map();
        this.kycTool = new KYCTool();
        this.initializeTools();
        this.loadPrompts();
    }

    public static getInstance(bot?: any): ToolManager {
        if (!ToolManager.instance) {
            if (!bot) {
                throw new Error('Bot instance required for first initialization');
            }
            ToolManager.instance = new ToolManager(bot);
        }
        return ToolManager.instance;
    }

    private initializeTools() {
        this.tools.set('login', new LoginTool());
        this.tools.set('otp', new OTPTool());
        this.tools.set('logout', new LogoutTool());
        this.tools.set('balance', new BalanceTool());
        this.tools.set('send', new SendTool());
        this.tools.set('withdraw', new WithdrawTool());
        this.tools.set('profile', new ProfileTool());
        this.tools.set('kyc', new KYCTool());
        this.tools.set('wallet', new WalletTool());
        this.tools.set('notify', new PusherNotifyTool(this.bot));
    }

    private loadPrompts() {
        const promptFiles = [
            'loginPrompt.txt',
            'otpPrompt.txt',
            'logoutPrompt.txt',
            'balancePrompt.txt',
            'sendPrompt.txt',
            'withdrawPrompt.txt',
            'profilePrompt.txt',
            'kycPrompt.txt',
            'walletPrompt.txt',
            'notifyPrompt.txt'
        ];

        for (const file of promptFiles) {
            try {
                const promptPath = path.join(__dirname, '../prompts', file);
                const prompt = fs.readFileSync(promptPath, 'utf-8');
                const toolName = file.replace('Prompt.txt', '');
                this.prompts.set(toolName, prompt);
            } catch (error) {
                console.error(`Error loading prompt for ${file}:`, error);
            }
        }
    }

    public getPrompt(toolName: string): string | undefined {
        return this.prompts.get(toolName);
    }

    public async executeTool(toolName: string, ...args: any[]): Promise<string> {
        const tool = this.tools.get(toolName);
        if (!tool) {
            throw new Error(`Tool ${toolName} not found`);
        }

        try {
            // Handle different parameter patterns for different tools
            switch (toolName) {
                case 'login':
                    return await tool.execute(args[0]);
                case 'otp':
                    return await tool.execute(args[0]);
                case 'logout':
                    return await tool.execute(args[0]);
                case 'balance':
                    return await tool.execute(args[0], args[1]);
                case 'send':
                    return await tool.execute(args[0], args[1], args[2], args[3]);
                case 'withdraw':
                    return await tool.execute(args[0], args[1], args[2], args[3]);
                case 'profile':
                    return await tool.execute(args[0]);
                case 'kyc':
                    return await tool.execute(args[0]);
                case 'wallet':
                    return await tool.execute(args[0], args[1], ...args.slice(2));
                case 'notify':
                    return await tool.execute(args[0], args[1]);
                default:
                    throw new Error(`Unsupported tool: ${toolName}`);
            }
        } catch (error: any) {
            throw new Error(`Error executing tool ${toolName}: ${error.message}`);
        }
    }

    private getHelpText(): string {
        return `Available commands:
/kyc <nationality> <country> - Start or check KYC verification status
Examples:
/kyc US US - For a US citizen residing in the US
/kyc GB UK - For a UK citizen residing in the UK
/kyc - To check your current KYC status

/help - Show this help message`;
    }

    async handleCommand(email: string, command: string): Promise<string> {
        try {
            const [toolName, ...args] = command.split(' ');
            
            switch (toolName.toLowerCase()) {
                case '/kyc':
                    if (args.length === 0) {
                        return await this.kycTool.execute(email);
                    } else if (args.length === 2) {
                        return await this.kycTool.execute(email, args[0], args[1]);
                    } else {
                        return `Invalid KYC command format. Please use:
/kyc <nationality> <country>
Examples:
/kyc US US - For a US citizen residing in the US
/kyc GB UK - For a UK citizen residing in the UK
/kyc - To check your current KYC status`;
                    }
                case '/help':
                    return this.getHelpText();
                default:
                    return 'Unknown command. Type /help for available commands.';
            }
        } catch (error) {
            console.error('Error handling command:', error);
            return `Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`;
        }
    }
} 
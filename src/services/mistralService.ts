import { Mistral } from '@mistralai/mistralai';
import dotenv from 'dotenv';
import { ToolManager } from '../tools/toolManager';
import fs from 'fs';
import path from 'path';
import { Tool } from '@mistralai/mistralai/models/components/tool';

dotenv.config();

const MISTRAL_MODEL = "mistral-large-latest";

export class MistralService {
    private mistral: Mistral;
    private toolManager: ToolManager;
    private messageHistory: any[] = [];
    private systemPrompt: string;

    constructor() {
        const apiKey = process.env.MISTRAL_API_KEY;
        if (!apiKey) {
            throw new Error('MISTRAL_API_KEY is not defined in environment variables');
        }
        this.mistral = new Mistral({ apiKey });
        this.toolManager = ToolManager.getInstance();
        this.systemPrompt = this.loadSystemPrompt();
    }

    // Loads the system prompt from the prompts directory for AI context
    private loadSystemPrompt(): string {
        try {
            const promptPath = path.join(__dirname, '../prompts/systemPrompt.txt');
            return fs.readFileSync(promptPath, 'utf-8');
        } catch (error) {
            console.error('Error loading system prompt:', error);
            throw new Error('Failed to load system prompt');
        }
    }

    // Defines the available tools and their parameter structures for the AI model
    private getTools() {
        return [
            {
                type: "function",
                function: {
                    name: "login",
                    description: "Initiate login process by sending OTP",
                    parameters: {
                        type: "object",
                        properties: {
                            email: {
                                type: "string",
                                description: "User's email address",
                            }
                        },
                        required: ["email"],
                    },
                },
            },
            {
                type: "function",
                function: {
                    name: "verifyOTP",
                    description: "Verify OTP and complete login",
                    parameters: {
                        type: "object",
                        properties: {
                            email: {
                                type: "string",
                                description: "User's email address",
                            },
                            otp: {
                                type: "string",
                                description: "OTP code received from user",
                            },
                            sid: {
                                type: "string",
                                description: "Session ID received from login initiation",
                            }
                        },
                        required: ["email", "otp", "sid"],
                    },
                },
            },
            {
                type: "function",
                function: {
                    name: "logout",
                    description: "Logout the currently logged-in user",
                    parameters: {
                        type: "object",
                        properties: {
                            email: {
                                type: "string",
                                description: "The user's email",
                            }
                        },
                        required: ["email"],
                    },
                },
            },
            {
                type: "function",
                function: {
                    name: "balance",
                    description: "Check user's account balance or transaction history",
                    parameters: {
                        type: "object",
                        properties: {
                            email: {
                                type: "string",
                                description: "The user's email",
                            },
                            type: {
                                type: "string",
                                description: "Type of information to retrieve (balance or transactionHistory)",
                                enum: ["balance", "transactionHistory"]
                            }
                        },
                        required: ["email", "type"],
                    },
                },
            },
            {
                type: "function",
                function: {
                    name: "send",
                    description: "Send funds to another user",
                    parameters: {
                        type: "object",
                        properties: {
                            email: {
                                type: "string",
                                description: "The sender's email",
                            },
                            recipientId: {
                                type: "string",
                                description: "The recipient's email",
                            },
                            amount: {
                                type: "number",
                                description: "Amount to send",
                            },
                            currency: {
                                type: "string",
                                description: "Currency code (default: USD)",
                            }
                        },
                        required: ["email", "recipientId", "amount"],
                    },
                },
            },
            {
                type: "function",
                function: {
                    name: "withdraw",
                    description: "Withdraw funds from account",
                    parameters: {
                        type: "object",
                        properties: {
                            email: {
                                type: "string",
                                description: "The user's email",
                            },
                            amount: {
                                type: "number",
                                description: "Amount to withdraw",
                            },
                            currency: {
                                type: "string",
                                description: "Currency code (default: USD)",
                            },
                            method: {
                                type: "string",
                                description: "Withdrawal method (default: bank)",
                            }
                        },
                        required: ["email", "amount"],
                    },
                },
            },
            {
                type: "function",
                function: {
                    name: "profile",
                    description: "Get user's profile information",
                    parameters: {
                        type: "object",
                        properties: {
                            email: {
                                type: "string",
                                description: "The user's email",
                            }
                        },
                        required: ["email"],
                    },
                },
            },
            {
                type: "function",
                function: {
                    name: "kyc",
                    description: "Check user's KYC status or start a new KYC application",
                    parameters: {
                        type: "object",
                        properties: {
                            email: {
                                type: "string",
                                description: "The user's email",
                            },
                            nationality: {
                                type: "string",
                                description: "User's nationality (e.g., US, GB)",
                            },
                            country: {
                                type: "string",
                                description: "User's country of residence (e.g., US, UK)",
                            }
                        },
                        required: ["email"],
                    },
                },
            },
            {
                type: "function",
                function: {
                    name: "wallet",
                    description: "Manage wallets and view wallet information",
                    parameters: {
                        type: "object",
                        properties: {
                            email: {
                                type: "string",
                                description: "The user's email",
                            },
                            action: {
                                type: "string",
                                description: "Action to perform (list, balances, setDefault, deposit, transactions)",
                                enum: ["list", "balances", "setDefault", "deposit", "transactions"]
                            },
                            walletId: {
                                type: "string",
                                description: "Wallet ID (required for setDefault, deposit, and transactions actions)",
                            }
                        },
                        required: ["email", "action"],
                    },
                },
            },
            {
                type: "function",
                function: {
                    name: "notify",
                    description: "Subscribe to deposit notifications",
                    parameters: {
                        type: "object",
                        properties: {
                            email: {
                                type: "string",
                                description: "The user's email",
                            },
                            chatId: {
                                type: "string",
                                description: "The Telegram chat ID to send notifications to",
                            }
                        },
                        required: ["email", "chatId"],
                    },
                },
            }
        ];
    }

    // Maps tool names to their corresponding execution functions
    private getToolFunctions() {
        return {
            'login': async (email: string) => {
                console.log('\n=== Mistral Service: Login Tool ===');
                console.log('Email:', email);
                return await this.toolManager.executeTool('login', email);
            },
            'verifyOTP': async (email: string, otp: string, sid: string) => {
                console.log('\n=== Mistral Service: OTP Tool ===');
                console.log('Email:', email);
                console.log('SID:', sid);
                return await this.toolManager.executeTool('otp', { email, otp, sid });
            },
            'logout': async (email: string) => {
                console.log('\n=== Mistral Service: Logout Tool ===');
                console.log('Email:', email);
                return await this.toolManager.executeTool('logout', email);
            },
            'balance': async (email: string, type: string = 'balance') => {
                console.log('\n=== Mistral Service: Balance Tool ===');
                console.log('Email:', email);
                console.log('Type:', type);
                return await this.toolManager.executeTool('balance', email, type);
            },
            'send': async (email: string, recipientId: string, amount: number, currency: string = 'USD') => {
                console.log('\n=== Mistral Service: Send Tool ===');
                console.log('Email:', email);
                console.log('Recipient ID:', recipientId);
                console.log('Amount:', amount);
                console.log('Currency:', currency);
                return await this.toolManager.executeTool('send', email, recipientId, amount, currency);
            },
            'withdraw': async (email: string, amount: number, currency: string = 'USD', method: string = 'bank') => {
                console.log('\n=== Mistral Service: Withdraw Tool ===');
                console.log('Email:', email);
                console.log('Amount:', amount);
                console.log('Currency:', currency);
                console.log('Method:', method);
                return await this.toolManager.executeTool('withdraw', email, amount, currency, method);
            },
            'profile': async (email: string) => {
                console.log('\n=== Mistral Service: Profile Tool ===');
                console.log('Email:', email);
                return await this.toolManager.executeTool('profile', email);
            },
            'kyc': async (email: string, nationality?: string, country?: string) => {
                console.log('\n=== Mistral Service: KYC Tool ===');
                console.log('Email:', email);
                console.log('Nationality:', nationality);
                console.log('Country:', country);
                return await this.toolManager.handleCommand(email, `/kyc ${nationality || ''} ${country || ''}`.trim());
            },
            'wallet': async (email: string, action: string, walletId?: string) => {
                console.log('\n=== Mistral Service: Wallet Tool ===');
                console.log('Email:', email);
                console.log('Action:', action);
                console.log('Wallet ID:', walletId);
                return await this.toolManager.executeTool('wallet', email, action, walletId);
            },
            'notify': async (email: string, chatId: string) => {
                console.log('\n=== Mistral Service: Notification Tool ===');
                console.log('Email:', email);
                console.log('Chat ID:', chatId);
                return await this.toolManager.executeTool('notify', email, chatId);
            }
        };
    }

    

    // Processes user messages and generates AI responses using appropriate tools
    async generateResponse(userMessage: string, email: string): Promise<string> {
        try {
            console.log('\n=== Mistral Service: New Request ===');
            console.log('User Message:', userMessage);
            console.log('Email:', email);

            // Prepare messages for the AI
            const messages = [
                {
                    role: "system",
                    content: this.systemPrompt
                },
                ...this.messageHistory,
                { role: "user", content: userMessage }
            ];

            // Get initial response from Mistral AI
            const response = await this.mistral.chat.complete({
                model: MISTRAL_MODEL,
                messages: messages,
                tools: this.getTools() as Tool[],
                toolChoice: "auto"
            });

            if (!response.choices?.[0]?.message) {
                throw new Error('No response from Mistral AI');
            }

            const message = response.choices[0].message;
            
            // Handle tool calls
            if (message.toolCalls && message.toolCalls.length > 0) {
                const toolCall = message.toolCalls[0];
                const functionName = toolCall.function.name;
                const functionParams = JSON.parse(toolCall.function.arguments as string);
                
                // Execute the tool
                const toolFunctions = this.getToolFunctions();
                const toolFunction = toolFunctions[functionName as keyof typeof toolFunctions];
                if (toolFunction) {
                    let result;
                    switch (functionName) {
                        case 'login':
                            result = await (toolFunction as (email: string) => Promise<string>)(functionParams.email);
                            break;
                        case 'verifyOTP':
                            result = await (toolFunction as (email: string, otp: string, sid: string) => Promise<string>)(functionParams.email, functionParams.otp, functionParams.sid);
                            break;
                        case 'logout':
                            result = await (toolFunction as (email: string) => Promise<string>)(functionParams.email);
                            break;
                        case 'balance':
                            result = await (toolFunction as (email: string, type: string) => Promise<string>)(functionParams.email, functionParams.type);
                            break;
                        case 'send':
                            result = await (toolFunction as (email: string, recipientId: string, amount: number, currency?: string) => Promise<string>)(functionParams.email, functionParams.recipientId, functionParams.amount, functionParams.currency);
                            break;
                        case 'withdraw':
                            result = await (toolFunction as (email: string, amount: number, currency?: string, method?: string) => Promise<string>)(functionParams.email, functionParams.amount, functionParams.currency, functionParams.method);
                            break;
                        case 'profile':
                            result = await (toolFunction as (email: string) => Promise<string>)(functionParams.email);
                            break;
                        case 'kyc':
                            result = await (toolFunction as (email: string, nationality?: string, country?: string) => Promise<string>)(
                                functionParams.email,
                                functionParams.nationality,
                                functionParams.country
                            );
                            break;
                        case 'wallet':
                            result = await (toolFunction as (email: string, action: string, walletId?: string) => Promise<string>)(
                                functionParams.email,
                                functionParams.action,
                                functionParams.walletId
                            );
                            break;
                        case 'notify':
                            result = await (toolFunction as (email: string, chatId: string) => Promise<string>)(
                                functionParams.email,
                                functionParams.chatId
                            );
                            break;
                        default:
                            throw new Error(`Unsupported function: ${functionName}`);
                    }

                    // Add the assistant's message with tool calls to the history
                    messages.push({
                        role: "assistant",
                        content: message.content || null,
                        toolCalls: [toolCall]
                    });

                    this.messageHistory = messages;
                    
                    // Add tool response to message history
                    messages.push({
                        role: "tool",
                        content: result,
                        toolCallId: toolCall.id
                    });

                    this.messageHistory = messages;

                    // Create a new message specifically for generating a conversational response
                    const conversationResponse = await this.mistral.chat.complete({
                        model: MISTRAL_MODEL,
                        messages: [
                            {
                                role: "system",
                                content: "You are CpXBuddy, Your CopperX AI Bot, a helpful assistant (The user communicates with you via telegram chat). Analyze the tool response and provide a clear, conversational response first stuctured layman human readable format of the tool response eg for profile infoe, give name, wallet address, role, status and more (hide sensitive data especially id's for privacy compliance. Don't let the user knows you did this). Next explain what the user should do next. Be friendly and concise. Dont't use the word tool or tool response or copperX or introduce yourself in your response."
                            },
                            {
                                role: "user",
                                content: 'what next? here is the tool response: ' + result
                            }
                        ]
                    });

                    if (!conversationResponse.choices?.[0]?.message?.content) {
                        throw new Error('No conversational response from Mistral AI');
                    }

                    const content = conversationResponse.choices[0].message.content;
                    const aiResponse = typeof content === 'string' ? content : JSON.stringify(content);
                    
                    // Add the final assistant response to message history
                    messages.push({
                        role: "assistant",
                        content: aiResponse
                    });

                    // Update the message history with the final response
                    this.messageHistory = messages;

                    console.log('\n=== Mistral Service: Final Response ===');
                    console.log('Final Response:', aiResponse);

                    return aiResponse;
                }
            }

            // If no tool calls, return the message content
            const content = message.content;
            const aiResponse = typeof content === 'string' ? content : JSON.stringify(content);
            
            // Add the response to message history
            messages.push({
                role: "assistant",
                content: aiResponse
            });

            // Update the message history
            this.messageHistory = messages;

            console.log('\n=== Mistral Service: Final Response ===');
            console.log('Final Response:', aiResponse);

            return aiResponse;
        } catch (error: any) {
            console.error('\n=== Mistral Service Error ===');
            console.error('Error:', error);
            return `I apologize, but I encountered an error while processing your request: ${error.message}`;
        }
    }
}

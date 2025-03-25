import TelegramBot from 'node-telegram-bot-api';
import { MistralService } from './services/mistralService';
import { ToolManager } from './tools/toolManager';
import { startServer } from './server';
import dotenv from 'dotenv';

dotenv.config();

// Initialize bot with your token
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: true });

// Initialize ToolManager with bot instance
const toolManager = ToolManager.getInstance(bot);

// Initialize MistralService
const mistralService = new MistralService();

// Define menu commands
const menuCommands = [
    { command: '/start', description: 'Start the bot' },
    { command: '/balance', description: 'Check your balance' },
    { command: '/login', description: 'Login to your account' },
    { command: '/logout', description: 'Logout from your account' },
    { command: '/profile', description: 'View your account profile' },
    { command: '/kyc', description: 'Check your KYC/KYB status' },
    { command: '/notify', description: 'Set up notifications' }
];

// Set up bot commands
bot.setMyCommands(menuCommands);

// Helper function to validate user ID
const validateUserId = (msg: TelegramBot.Message): string => {
    const userId = msg.from?.id;
    if (!userId) {
        throw new Error('USER_ID_REQUIRED');
    }
    return userId.toString();
};

// Helper function to handle errors
const handleError = async (chatId: number, error: any) => {
    if (error.message === 'USER_ID_REQUIRED') {
        await bot.sendMessage(chatId, 'Please send this command as a direct message to the bot to ensure proper user identification.');
    } else {
        console.error('Error:', error);
        await bot.sendMessage(chatId, 'Sorry, there was an error processing your request.');
    }
};

// Helper function to get default message for each command
const getDefaultMessage = (command: string): string => {
    switch (command) {
        case 'login':
            return "Initializing login process...";
        case 'verifyOTP':
            return "Verifying OTP code...";
        case 'logout':
            return "Processing logout request...";
        case 'balance':
            return "Fetching account balance...";
        case 'send':
            return "Processing fund transfer...";
        case 'withdraw':
            return "Processing withdrawal request...";
        case 'profile':
            return "Fetching profile information...";
        case 'notify':
            return "Setting up notifications...";
        case 'kyc':
            return "Checking KYC status...";
        case 'wallet':
            return "Processing wallet command...";
        default:
            return "Processing your request...";
    }
};

// Handle /start command
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const message = 'Welcome to CPXBuddy! I can help you with:\n\n' +
        'CpXBuddy: "Your CopperX AI Trading Buddy".\n' +
        'CpXBuddy is your trusted Telegram companion for all things related to your CopperX trading platform using natural language.\n\n' +
        'With CpXBuddy, you can:\n' +
        '- Check your balance\n' +
        '- Login to your account\n' +
        '- Logout from your account\n' +
        '- View your account profile\n' +
        '- check your KYC/KYB status\n' +
        '- Manage wallets and view wallet information (eg type the /wallet command followed by your message of what you want to do: Actions include get list of wallets, set & get default wallet, get transfer history)\n' +
        '- And much more!';
    
    await bot.sendMessage(chatId, message);
});

// Handle /login command
bot.onText(/\/login/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId, 'Please enter your email address:');
});

// Handle /notify command
bot.onText(/\/notify/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const userId = validateUserId(msg);
        // Send default message immediately
        await bot.sendMessage(chatId, getDefaultMessage('notify'));
        
        // Process the command in the background
        const aiResponse = await mistralService.generateResponse("/notify", userId, chatId);
        await bot.sendMessage(chatId, aiResponse);
    } catch (error) {
        await handleError(chatId, error);
    }
});

// Handle /balance command
bot.onText(/\/balance/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const userId = validateUserId(msg);
        // Send default message immediately
        await bot.sendMessage(chatId, getDefaultMessage('balance'));
        
        // Process the command in the background
        const aiResponse = await mistralService.generateResponse("/balance", userId, chatId);
        await bot.sendMessage(chatId, aiResponse);
    } catch (error) {
        await handleError(chatId, error);
    }
});

// Handle /send command
bot.onText(/\/send/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const userId = validateUserId(msg);
        // Send default message immediately
        await bot.sendMessage(chatId, getDefaultMessage('send'));
        
        // Process the command in the background
        const aiResponse = await mistralService.generateResponse("/send", userId, chatId);
        await bot.sendMessage(chatId, aiResponse);
    } catch (error) {
        await handleError(chatId, error);
    }
});

// Handle /withdraw command
bot.onText(/\/withdraw/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const userId = validateUserId(msg);
        // Send default message immediately
        await bot.sendMessage(chatId, getDefaultMessage('withdraw'));
        
        // Process the command in the background
        const aiResponse = await mistralService.generateResponse("/withdraw", userId, chatId);
        await bot.sendMessage(chatId, aiResponse);
    } catch (error) {
        await handleError(chatId, error);
    }
});

// Handle /logout command
bot.onText(/\/logout/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const userId = validateUserId(msg);
        // Send default message immediately
        await bot.sendMessage(chatId, getDefaultMessage('logout'));
        
        // Process the command in the background
        const aiResponse = await mistralService.generateResponse("/logout", userId, chatId);
        await bot.sendMessage(chatId, aiResponse);
    } catch (error) {
        await handleError(chatId, error);
    }
});

// Handle /profile command
bot.onText(/\/profile/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const userId = validateUserId(msg);
        // Send default message immediately
        await bot.sendMessage(chatId, getDefaultMessage('profile'));
        
        // Process the command in the background
        const aiResponse = await mistralService.generateResponse("/profile", userId, chatId);
        await bot.sendMessage(chatId, aiResponse);
    } catch (error) {
        await handleError(chatId, error);
    }
});

// Handle /kyc command
bot.onText(/\/kyc/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const userId = validateUserId(msg);
        // Send default message immediately
        await bot.sendMessage(chatId, getDefaultMessage('kyc'));
        
        // Process the command in the background
        const aiResponse = await mistralService.generateResponse("/kyc", userId, chatId);
        await bot.sendMessage(chatId, aiResponse);
    } catch (error) {
        await handleError(chatId, error);
    }
});

// Handle /wallet command
bot.onText(/\/wallet (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    try {
        const userId = validateUserId(msg);
        const userMessage = match?.[1] || '';
        
        // Send default message immediately
        await bot.sendMessage(chatId, getDefaultMessage('wallet'));
        
        // Process the command with the user's message
        const aiResponse = await mistralService.generateResponse(`/wallet ${userMessage}`, userId, chatId);
        await bot.sendMessage(chatId, aiResponse);
    } catch (error) {
        await handleError(chatId, error);
    }
});

// Handle messages
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text) return;

    // Skip command messages
    if (text.startsWith('/')) return;

    try {
        const response = await mistralService.generateResponse(text, chatId.toString(), chatId);
        await bot.sendMessage(chatId, response);
    } catch (error) {
        console.error('Error processing message:', error);
        await bot.sendMessage(chatId, 'Sorry, I encountered an error processing your request. Please try again.');
    }
});

// Start the server
startServer();

console.log('Bot is running...'); 
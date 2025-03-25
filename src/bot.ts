import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { MistralService } from './services/mistralService';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not defined in environment variables');
}

const bot = new TelegramBot(token, { polling: true });
const mistralService = new MistralService();

// Define menu commands
const menuCommands = [
    { command: '/start', description: 'Start the bot' },
    { command: '/balance', description: 'Check your balance' },
    { command: '/send', description: 'Send funds' },
    { command: '/withdraw', description: 'Withdraw funds' },
    { command: '/login', description: 'Login to your account' },
    { command: '/logout', description: 'Logout from your account' },
    { command: '/profile', description: 'View your account profile' },
    { command: '/kyc', description: 'Check your KYC/KYB status' }
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
        case 'kyc':
            return "Checking KYC status...";
        default:
            return "Processing your request...";
    }
};

// Handle /start command
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const userId = validateUserId(msg);
        const welcomeMessage = `
Welcome to CpXBuddy! 👋

CpXBuddy: 'Your CopperX AI Bot, your trusted Telegram buddy for all things related to your CopperX account using natural language.'

With CpXBuddy, you can:
- Check your balance
- Send funds
- Withdraw funds
- Login to your account
- Logout from your account
- View your account profile
- check your KYC/KYB status
- And much more!

Here are the available commands:
/balance - Check your balance
/send - Send funds
/withdraw - Withdraw funds
/login - Login to your account
/logout - Logout from your account
/profile - View your account profile
/kyc - Check your KYC/KYB status

How can I help you today?
    `;
        await bot.sendMessage(chatId, welcomeMessage);
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
        const aiResponse = await mistralService.generateResponse("/balance", userId);
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
        const aiResponse = await mistralService.generateResponse("/send", userId);
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
        const aiResponse = await mistralService.generateResponse("/withdraw", userId);
        await bot.sendMessage(chatId, aiResponse);
    } catch (error) {
        await handleError(chatId, error);
    }
});

// Handle /login command
bot.onText(/\/login/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const userId = validateUserId(msg);
        // Send default message immediately
        await bot.sendMessage(chatId, getDefaultMessage('login'));
        
        // Process the command in the background
        const aiResponse = await mistralService.generateResponse("/login", userId);
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
        const aiResponse = await mistralService.generateResponse("/logout", userId);
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
        const aiResponse = await mistralService.generateResponse("/profile", userId);
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
        const aiResponse = await mistralService.generateResponse("/kyc", userId);
        await bot.sendMessage(chatId, aiResponse);
    } catch (error) {
        await handleError(chatId, error);
    }
});

// Handle regular messages
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Ignore if no text or if it's a command
    if (!text || text.startsWith('/')) return;

    try {
        const userId = validateUserId(msg);
        const aiResponse = await mistralService.generateResponse(text, userId);
        await bot.sendMessage(chatId, aiResponse);
    } catch (error) {
        await handleError(chatId, error);
    }
});

console.log('Bot is running...'); 
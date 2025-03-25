# cpxBuddy

A sophisticated Telegram bot powered by Mistral AI that provides intelligent financial services and assistance. The bot combines natural language processing with secure financial operations to deliver a seamless user experience.

## Features

- 🤖 **AI-Powered Responses**: Utilizes Mistral AI for natural and contextual conversations
- 💳 **Financial Services**:
  - Account balance checking
  - Money transfers
  - Withdrawals
  - Wallet management
  - KYC/KYB verification
- 🔐 **Secure Authentication**:
  - User login/logout functionality
  - OTP verification
  - Profile management
- 🔔 **Real-time Notifications**: Set up deposit notifications
- 🛠️ **Tool Integration**: Seamless integration with various financial tools and services
- ⚡ **Fast Response Times**: Immediate acknowledgment of commands with background processing

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Telegram Bot Token
- Mistral AI API Key

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/cpxbuddy.git
   cd cpxbuddy
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
   MISTRAL_API_KEY=your_mistral_api_key_here
   ```
   - Get your Telegram Bot Token from [@BotFather](https://t.me/botfather)
   - Get your Mistral API Key from [Mistral AI](https://mistral.ai/)

## Available Commands

- `/start` - Start the bot
- `/balance` - Check your account balance
- `/login` - Login to your account
- `/logout` - Logout from your account
- `/profile` - View your account profile
- `/kyc` - Check your KYC/KYB status
- `/notify` - Set up notifications
- `/wallet` - Manage your wallet
- `/send` - Send money
- `/withdraw` - Withdraw funds

## Development

Run the bot in development mode:
```bash
npm run dev
```

## Production Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Project Structure

```
cpxBuddy/
├── src/
│   ├── bot.ts              # Main bot implementation
│   ├── services/           # Service layer
│   │   └── mistralService.ts  # Mistral AI integration
│   └── tools/             # Tool implementations
│       └── toolManager.ts  # Tool management system
├── dist/                  # Compiled JavaScript files
├── .env                   # Environment variables
├── package.json          # Project dependencies
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## Error Handling

The bot includes comprehensive error handling for:
- Invalid user IDs
- API failures
- Authentication errors
- Network issues
- Invalid commands

## Security

- Environment variables for sensitive data
- Secure authentication flow
- Input validation
- Error message sanitization
- Privacy compliance in responses

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers. 
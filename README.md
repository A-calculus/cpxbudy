# cpxBuddy

A Telegram bot that uses AI to provide intelligent responses to user messages.

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
   MISTRAL_API_KEY=your_mistral_api_key_here
   ```
   - Get your Telegram Bot Token from [@BotFather](https://t.me/botfather)
   - Get your Mistral API Key from [Mistral AI](https://mistral.ai/)

## Running the Bot

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## Features

- Receives messages from Telegram users
- Processes messages using Mistral AI
- Sends AI-generated responses back to users
- Error handling and logging

## Project Structure

```
cpxBuddy/
├── src/
│   └── bot.ts         # Main bot implementation
├── .env               # Environment variables
├── package.json       # Project dependencies
├── tsconfig.json      # TypeScript configuration
└── README.md         # This file
``` 
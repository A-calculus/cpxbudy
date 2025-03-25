import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Basic health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Bot is running',
        botLink: 'https://t.me/CpxBuddyBot'
    });
});

// Start the server
export const startServer = () => {
    app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
        console.log(`Telegram bot: uses the link https://t.me/CpxBuddyBot`);
    });
}; 
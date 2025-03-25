import express from 'express';
import Pusher from 'pusher';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const pusher = new Pusher({
    appId: process.env.VITE_PUSHER_APP_ID!,
    key: process.env.VITE_PUSHER_KEY!,
    secret: process.env.VITE_PUSHER_SECRET!,
    cluster: process.env.VITE_PUSHER_CLUSTER!,
    useTLS: true
});

// Verify webhook signature
const verifyWebhook = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const webhook = pusher.webhook(req);
    if (webhook.isValid()) {
        next();
    } else {
        res.status(401).send('Invalid webhook signature');
    }
};

// Handle deposit events
router.post('/deposit', verifyWebhook, (req: express.Request, res: express.Response) => {
    const events = req.body.events;
    events.forEach((event: any) => {
        if (event.name === 'deposit') {
            // Handle deposit event
            console.log('Received deposit event:', event.data);
            // Here you would typically emit the event to connected clients
            // or process it as needed
        }
    });
    res.status(200).send('OK');
});

export default router; 
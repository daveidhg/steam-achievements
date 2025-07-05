import express from 'express';
import dotenv from 'dotenv';
import { createTables } from './schema';
import pino from 'pino';
import { requireAPIKey } from './auth';
import { router as webhookRouter } from './webhooks';
import { startDailyWebhookScheduler } from './scheduler';

dotenv.config();
const logger = pino();
const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(requireAPIKey)
app.use('/webhooks', webhookRouter);

app.get('/', (req, res) => {
    res.send('Webhook service is running!')
})

createTables().then(() => {
    app.listen(port, () => {
    logger.info(`Webhook service is running on port ${port}`)
    });
});

startDailyWebhookScheduler();
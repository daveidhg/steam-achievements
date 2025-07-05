import express from 'express';
import dotenv from 'dotenv';
import pino from 'pino';
import { requireAPIKey } from './auth';
import { router as notificationReceiver } from './notificationReceiver';
import { createTable } from './schema';
import { schedulePollingQueueHandler } from './pollingQueueHandler';

dotenv.config();
const logger = pino();
const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(requireAPIKey);
app.use('/notify', notificationReceiver);

app.get('/', (req, res) => {
    res.send('Polling service is running!');
});

createTable().then(() => {
    app.listen(port, () => {
        logger.info(`Polling service is running on port ${port}`);
    });
});

schedulePollingQueueHandler()
import express from 'express';
import dotenv from 'dotenv';
import { createTables } from './schema';
import pino from 'pino';
import { requireAPIKey } from './auth';
import { router as subscriptionRouter } from './subscriptions';
import { startDailySubscriptionScheduler } from './scheduler';

dotenv.config();
const logger = pino();
const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(requireAPIKey)
app.use('/subscriptions', subscriptionRouter);

app.get('/', (req, res) => {
    res.send('Subscription service is running!')
})

createTables().then(() => {
    app.listen(port, () => {
    logger.info(`Subscription service is running on port ${port}`)
    });
});

startDailySubscriptionScheduler();
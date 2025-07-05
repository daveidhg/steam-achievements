import cron from 'node-cron';
import { db } from './db';
import pino from 'pino';
import dotenv from 'dotenv';
import { notifyPollingService } from './subscriptionNotifyer';

dotenv.config();
const logger = pino();

export function startDailySubscriptionScheduler() {
    // Schedule a job to run every day at 12:00 GMT +2
    // Minute, Hour, Day of Month, Month, Day of Week
    cron.schedule('0 12 * * *', async () => {
        logger.info('Running daily subscription job');
        try {
            const result = await db.query('SELECT steam_id, callback_url FROM subscriptions')
            const subscriptions = result.rows;

            if (subscriptions.length === 0) {
                logger.info('No subscriptions found');
                return;
            }
            notifyPollingService(subscriptions);
        }
        catch (e) {
            logger.error({ e }, 'Failed to fetch subscriptions from database');
        }
    })
}
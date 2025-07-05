import cron from 'node-cron';
import { db } from './db';
import axios from 'axios';
import pino from 'pino';
import dotenv from 'dotenv';

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

            if (!process.env.POLLING_URL) {
                logger.error('POLLING_URL environment variable is not set');
                return;
            }
            for (const subscription of subscriptions) {
                try {
                    await axios.post(process.env.POLLING_URL, {
                        steam_id: subscription.steam_id,
                        callback_url: subscription.callback_url
                    })
                    logger.info(`Notified polling service for subscription: ${subscription.steam_id} - ${subscription.callback_url}`);
                }
                catch (e) {
                    logger.error({ e, subscription }, 'Failed to notify polling service for subscription');
                }
            }
        }
        catch (e) {
            logger.error({ e }, 'Failed to fetch subscriptions from database');
        }
    })
}
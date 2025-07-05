import cron from 'node-cron';
import { db } from './db';
import axios from 'axios';
import pino from 'pino';
import dotenv from 'dotenv';

dotenv.config();
const logger = pino();

export function startDailyWebhookScheduler() {
    // Schedule a job to run every day at 12:00 GMT +2
    // Minute, Hour, Day of Month, Month, Day of Week
    cron.schedule('0 12 * * *', async () => {
        logger.info('Running daily webhook job');
        try {
            const result = await db.query('SELECT steam_id, callback_url FROM webhooks')
            const webhooks = result.rows;

            if (webhooks.length === 0) {
                logger.info('No webhooks found');
                return;
            }

            if (!process.env.POLLING_URL) {
                logger.error('POLLING_URL environment variable is not set');
                return;
            }
            for (const webhook of webhooks) {
                try {
                    await axios.post(process.env.POLLING_URL, {
                        steam_id: webhook.steam_id,
                        callback_url: webhook.callback_url
                    })
                    logger.info(`Notified polling service for webhook: ${webhook.steam_id} - ${webhook.callback_url}`);
                }
                catch (e) {
                    logger.error({ e, webhook }, 'Failed to notify polling service for webhook');
                }
            }
        }
        catch (e) {
            logger.error({ e }, 'Failed to fetch webhooks from database');
        }
    })
}
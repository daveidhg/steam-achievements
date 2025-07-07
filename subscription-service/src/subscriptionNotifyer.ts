import axios from "axios";
import pino from "pino";
import dotenv from "dotenv";

dotenv.config();
const logger = pino();

export async function notifyPollingService(subscriptions: { steamid: string, callback_url: string }[], initial: boolean = false) {
    if (!process.env.POLLING_URL) {
        logger.error('POLLING_URL environment variable is not set');
        return;
    }
    for (const subscription of subscriptions) {
        try {
            await axios.post(process.env.POLLING_URL, {
                steamid: subscription.steamid,
                callback_url: subscription.callback_url,
                initial: initial
            },
            {
                headers: {apikey: process.env.API_KEY}
        });
            logger.info(`Notified polling service for subscription: ${subscription.steamid} - ${subscription.callback_url}`);
        }
        catch (e) {
            logger.error({ e, subscription }, 'Failed to notify polling service for subscription');
        }
    }
}

import { Router, Request, Response } from "express";
import pino from "pino";
import { db } from "./db";
import { notifyPollingService } from "./subscriptionNotifyer";

const logger = pino();
export const router = Router();

function isValidSteamID(steam_id: string): boolean {
    // Steam ID should be a 17-digit numeric string
    return typeof steam_id === 'string' && /^[0-9]{17}$/.test(steam_id); 
}

function isValidCallbackURL(callback_url: string): boolean {
    try {
        const parsedUrl = new URL(callback_url);

        if (/[;'"`<>{}\\]/.test(parsedUrl.href)) {
            logger.warn(`Invalid characters in callback URL: ${callback_url}`);
            return false;
        }

        return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch (e) {
        return false;
    }
}

router.post('/', async (req: Request, res: Response) => {
    const { steam_id, callback_url } = req.body;

    if (!isValidSteamID(steam_id) || !isValidCallbackURL(callback_url)) {
        res.status(400).json({ error: 'Missing or invalid steam_id or callback_url' });
        return;
    }

    try {
        const result = await db.query(
            `INSERT INTO subscriptions (steam_id, callback_url) VALUES ($1, $2) ON CONFLICT (steam_id, callback_url) DO NOTHING`,
            [steam_id, callback_url]
        );

        if (result.rowCount === 0) {
            logger.info('Duplicate subscription skipped')
            res.status(200).json({ message: 'Subscription already exists, no action taken.'})
        }
        else {
            // Notify the polling service immediately for the new subscription
            notifyPollingService([{ steam_id, callback_url }], true);
            logger.info(`subscription registered for steam ID ${steam_id}`);
            res.status(201).json({ message: 'Subscription registered' });
        }

    } catch (e) {
        logger.error({ e }, 'Failed to register subscription');
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/', async (req: Request, res: Response) => {
    const { steam_id, callback_url } = req.body;

    if (!isValidSteamID(steam_id) || !isValidCallbackURL(callback_url)) {
        res.status(400).json({ error: 'Missing or invalid steam_id or callback_url'});
        return;
    }

    try {
        await db.query(
            'DELETE FROM subscriptions WHERE steam_id = $1 AND callback_url = $2',
            [steam_id, callback_url]
        );
        logger.info(`subscription deleted for steam ID ${steam_id}`);
        res.status(200).json({ message: 'Subscription deleted' });
    }
    catch (e) {
        logger.error({ e }, 'Failed to delete subscription');
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/', async (req: Request, res: Response) => {
    try {
        const result = await db.query('SELECT * FROM subscriptions');
        logger.info(`Retrieved ${result.rowCount} subscriptions`);
        res.status(200).json(result.rows);
    }
    catch (e) {
        logger.error({ e }, 'Failed to retrieve subscriptions');
        res.status(500).json({ error: 'Internal server error' });
    }
});
import { Router, Request, Response } from "express";
import pino from "pino";
import { db } from "./db";

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
            `INSERT INTO webhooks (steam_id, callback_url) VALUES ($1, $2) ON CONFLICT (steam_id, callback_url) DO NOTHING`,
            [steam_id, callback_url]
        );

        if (result.rowCount === 0) {
            logger.info('Duplicate webhook skipped')
            res.status(200).json({ message: 'Webhook already exists, no action taken.'})
        }
        else {
            logger.info(`Webhook registered for steam ID ${steam_id}`);
            res.status(201).json({ message: 'Webhook registered' });
        }

    } catch (e) {
        logger.error({ e }, 'Failed to register webhook');
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
            'DELETE FROM webhooks WHERE steam_id = $1 AND callback_url = $2',
            [steam_id, callback_url]
        );
        logger.info(`Webhook deleted for steam ID ${steam_id}`);
        res.status(200).json({ message: 'Webhook deleted' });
    }
    catch (e) {
        logger.error({ e }, 'Failed to delete webhook');
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/', async (req: Request, res: Response) => {
    try {
        const result = await db.query('SELECT * FROM webhooks');
        logger.info(`Retrieved ${result.rowCount} webhooks`);
        res.status(200).json(result.rows);
    }
    catch (e) {
        logger.error({ e }, 'Failed to retrieve webhooks');
        res.status(500).json({ error: 'Internal server error' });
    }
});
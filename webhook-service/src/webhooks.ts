import { Router, Request, Response } from "express";
import pino from "pino";
import { db } from "./db";

const logger = pino();
export const router = Router();

router.post('/', async (req: Request, res: Response) => {
    const { steam_id, callback_url } = req.body;

    if (!steam_id || !callback_url) {
        res.status(400).json({ error: 'Missing steam_id or callback_url' });
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

    if (!steam_id || !callback_url) {
        res.status(400).json({ error: 'Missing steam_id or callback_url'});
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
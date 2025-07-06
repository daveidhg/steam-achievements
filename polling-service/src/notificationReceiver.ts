import pino from "pino";
import { db } from "./db";
import dotenv from "dotenv";
import { Router, Request, Response } from "express";

dotenv.config();
const logger = pino();

export const router = Router();

router.post('/', async (req: Request, res: Response) => {
    const {steam_id, callback_url, initial} = req.body;
    if (!steam_id || !callback_url) {
        logger.error('Missing steam_id or callback_url in request body');
        res.status(400).json({ error: 'Missing steam_id or callback_url' });
        return;
    }
    try {
        // First, check if a pending entry already exists for this steam_id and callback_url
        const { rowCount } = await db.query(
            `SELECT 1 FROM polling_queue WHERE steam_id = $1 AND callback_url = $2 AND status = 'pending'`,
            [steam_id, callback_url]
        );

        if ((rowCount ?? 0) > 0) {
            res.status(200).json({ message: 'Pending entry already exists' });
            return;
        }

        // No pending entry exists, insert a new one
        await db.query(
            `INSERT INTO polling_queue (steam_id, callback_url, initial, status) VALUES ($1, $2, $3, 'pending')`,
            [steam_id, callback_url, initial]
        );
        res.status(201).json({ message: 'Entry added to polling queue' });
    }
    catch (e) {
        logger.error(e, 'Failed to insert into polling queue');
        res.status(500).json({ error: 'Internal server error' });
    }
})



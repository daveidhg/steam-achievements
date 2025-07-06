import { Router, Request, Response } from 'express';
import pino from 'pino';
import { db } from './db';
import dotenv from 'dotenv';

dotenv.config();
const logger = pino();

export const router = Router();

router.post('/', async (req: Request, res: Response) => {
    const { steam_id, appid, achievements } = req.body;
    if (!steam_id || !appid || !achievements || !Array.isArray(achievements)) {
        logger.error('Missing or invalid steam_id, appid, or achievements in request body');
        res.status(400).json({ error: 'Missing or invalid steam_id, appid, or achievements' });
        return;
    }
    try {
        const insertAchievements = achievements.map((achievement: any) => {
            const { name, description, unlocktime } = achievement;
            return db.query(
                `INSERT INTO achievements (steam_id, appid, game_name, achievement_name, unlock_time, description)
                 VALUES ($1, $2, $3, $4, to_timestamp($5), $6)
                 ON CONFLICT (steam_id, appid, achievement_name, unlock_time) DO NOTHING`,
                [steam_id, appid, achievement.gamename || 'Unknown Game', name, unlocktime, description]
            );
        });

        await Promise.all(insertAchievements);
        logger.info(`Achievements received and stored for steam ID ${steam_id}`);
        res.status(201).json({ message: 'Achievements received and stored' });
    }
    catch (e) {
        logger.error(e, 'Failed to insert achievements into database');
        res.status(500).json({ error: 'Internal server error' });
    }
})

router.get('/', async (req: Request, res: Response) => {
    const { steam_id, appid } = req.query;

        // Validate query parameters if provided
        if (steam_id && !/^\d{17}$/.test(steam_id as string)) {
            res.status(400).json({error: 'Invalid steam_id format. It should be a 17-digit numeric string.'});
            return;
        }

        if (appid && !/^\d$/.test(appid as string)) {
            res.status(400).json({error: 'Invalid appid format. It should be a numeric string.'});
            return;
        }
    
    try {
        let baseQuery = `SELECT * FROM achievements`;
        const conditions: string[] = [];
        const values: any[] = [];

        if (steam_id) {
            conditions.push(`steam_id = $${values.length + 1}`);
            values.push(steam_id);
        }

        if (appid) {
            conditions.push(`appid = $${values.length + 1}`);
            values.push(appid);
        }

        if (conditions.length > 0) {
            baseQuery += ` WHERE ${conditions.join(' AND ')}`;
        }

        baseQuery += ' ORDER BY unlock_time DESC';

        const result = await db.query(baseQuery, values);
        if (result.rows.length === 0) {
            res.status(404).json({ message: 'No achievements found for the given criteria' });
            return;
        }
        res.status(200).json(result.rows);
    }
    catch (e) {
        logger.error(e, 'Failed to query achievements from database');
        res.status(500).json({ error: 'Internal server error' });
    }
})
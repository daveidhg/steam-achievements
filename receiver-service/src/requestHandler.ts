import { Router, Request, Response } from 'express';
import express from 'express';
import pino from 'pino';
import { db } from './db';
import dotenv from 'dotenv';
import { createStats } from './stats';
import path from 'path';

dotenv.config();
const logger = pino();

export const router = Router();

router.use(express.static(path.join(__dirname, 'public')));

router.post('/', async (req: Request, res: Response) => {
    const { steamid, appid, achievements } = req.body;
    if (!steamid || !appid || !achievements || !Array.isArray(achievements)) {
        logger.error('Missing or invalid steamid, appid, or achievements in request body');
        res.status(400).json({ error: 'Missing or invalid steamid, appid, or achievements' });
        return;
    }
    try {
        const insertAchievements = achievements.map((achievement: any) => {
            const { name, description, unlocktime } = achievement;
            return db.query(
                `INSERT INTO achievements (steamid, appid, game_name, achievement_name, unlock_time, description)
                 VALUES ($1, $2, $3, $4, to_timestamp($5), $6)
                 ON CONFLICT (steamid, appid, achievement_name, unlock_time) DO NOTHING`,
                [steamid, appid, achievement.gamename || 'Unknown Game', name, unlocktime, description]
            );
        });

        await Promise.all(insertAchievements);
        logger.info(`Achievements received and stored for steamid ${steamid} and appid ${appid}`);
        res.status(201).json({ message: 'Achievements received and stored' });
    }
    catch (e) {
        logger.error(e, 'Failed to insert achievements into database');
        res.status(500).json({ error: 'Internal server error' });
    }
})

router.get('/', async (req: Request, res: Response) => {
    const { steamid, appid, stats } = req.query;

    // Validate query parameters if provided
    if (steamid && !/^\d{17}$/.test(steamid as string)) {
        res.status(400).json({error: 'Invalid steamid format. It should be a 17-digit numeric string.'});
        return;
    }

    if (appid && !/^\d+$/.test(appid as string)) {
        res.status(400).json({error: 'Invalid appid format. It should be a numeric string.'});
        return;
    }
    
    try {
        let baseQuery = `SELECT * FROM achievements`;
        const conditions: string[] = [];
        const values: any[] = [];

        if (steamid) {
            conditions.push(`steamid = $${values.length + 1}`);
            values.push(steamid);
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

        if (stats === 'true') {
            const stats = createStats(result.rows);
            res.status(200).json({"stats": stats, "achievements": result.rows});
            return;
        } 

        res.status(200).json(result.rows);
    }
    catch (e) {
        logger.error(e, 'Failed to query achievements from database');
        res.status(500).json({ error: 'Internal server error' });
    }
})

router.get('/graphdata', async (req: Request, res: Response) => {
    const { steamid, appid } = req.query;

    // Validate query parameters if provided
    if (steamid && !/^\d{17}$/.test(steamid as string)) {
        res.status(400).json({error: 'Invalid steamid format. It should be a 17-digit numeric string.'});
        return;
    }

    if (appid && !/^\d+$/.test(appid as string)) {
        res.status(400).json({error: 'Invalid appid format. It should be a numeric string.'});
        return;
    }

    try {
        let baseQuery = `SELECT * FROM achievements`;
        const conditions: string[] = [];
        const values: any[] = [];

        if (steamid) {
            conditions.push(`steamid = $${values.length + 1}`);
            values.push(steamid);
        }

        if (appid) {
            conditions.push(`appid = $${values.length + 1}`);
            values.push(appid);
        }

        if (conditions.length > 0) {
            baseQuery += ` WHERE ${conditions.join(' AND ')}`;
        }

        baseQuery += ' ORDER BY unlock_time ASC';

        const result = await db.query(baseQuery, values);
        if (result.rows.length === 0) {
            res.status(404).json({ message: 'No achievements found for the given criteria' });
            return;
        }

        const achievements = result.rows.map((achievement: any) => new Date(achievement.unlock_time).toISOString().slice(0, 10));
        let count = 0;
        const graphData: Record<string, number> = {};
        achievements.forEach(date => {
            count++;
            graphData[date] = count;
        });

        res.status(200).json({
            keys: Object.keys(graphData),
            values: Object.values(graphData)
        });
    }
    catch (e) {
        logger.error(e, 'Failed to generate graph data');
        res.status(500).json({ error: 'Internal server error' });
    }
})

router.get('/graph', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'graph.html'));
})
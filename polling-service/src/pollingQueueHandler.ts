import { db } from "./db";
import pino from "pino";
import dotenv from "dotenv";
import { getAchievements, getAllPlayedGames, getRecentlyPlayedGames } from "./steamApi";
import axios from "axios";

dotenv.config();
const logger = pino();

async function handlePollingQueue() {
    try {
        const { rows } = await db.query(
            `SELECT * FROM polling_queue WHERE status = 'pending' ORDER BY id LIMIT 1`
        )

        if (rows.length === 0) {
            return;
        }

        const { id, steam_id, callback_url, initial } = rows[0];

        await db.query(`UPDATE polling_queue SET status = 'processing' WHERE id = $1`, [id])

        let games: any[];
        if (initial) {
            logger.info(`Initial processing for Steam ID: ${steam_id}`);
            games = await getAllPlayedGames(steam_id);
        }
        else {
            logger.info(`Scheduled processing for Steam ID: ${steam_id}`);
            games = await getRecentlyPlayedGames(steam_id);
        }
        for (const game of games) {
            // Limit requests to avoid hitting API limits
            await new Promise(f => setTimeout(f, 2000)); 

            var achievements = await getAchievements(steam_id, game.appid);
            if (!initial) {
                // Filter out achievements unlocked more than 24 hours ago
                achievements = achievements.filter((achievement: any) => (Date.now() / 1000 - achievement.unlocktime) > (60 * 60 * 24)); 
            }
            await axios.post(callback_url, {
                apikey: process.env.API_KEY,
                steam_id: steam_id,
                appid: game.appid,
                achievements: achievements
            })
        };
        await db.query(`UPDATE polling_queue SET status = 'completed' WHERE id = $1`, [id]);
        logger.info(`Successfully processed Steam ID: ${steam_id}`);
    }
    catch (e) {
        logger.error(e, 'Failed to query the database');
        return;
    }
}

export async function schedulePollingQueueHandler() {
  try {
    await handlePollingQueue();
  } catch (err) {
    console.error('Error in polling queue handler:', err);
  } finally {
    setTimeout(schedulePollingQueueHandler, 5); // Wait 5s after finish to avoid hitting API limits
  }
}

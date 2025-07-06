import { db } from './db';
import pino from 'pino';

const logger = pino();

export async function createTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS achievements (
        id SERIAL PRIMARY KEY,
        steam_id TEXT NOT NULL,
        appid TEXT NOT NULL,
        game_name TEXT NOT NULL,
        achievement_name TEXT NOT NULL,
        unlock_time TIMESTAMP NOT NULL,
        description TEXT,
        UNIQUE(steam_id, appid, achievement_name, unlock_time)
      );
    `);
    logger.info('Table created or already exists');
  }
  catch (e) {
    logger.error(e, 'Failed to query the database')
  }
}

import { db } from './db';
import pino from 'pino';

const logger = pino();

export async function createTables() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        steamid TEXT NOT NULL,
        callback_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(steam_id, callback_url)
      );
    `);
    logger.info('Table created or already exists');
  }
  catch (e) {
    logger.error(e, 'Failed to query the database')
  }
}

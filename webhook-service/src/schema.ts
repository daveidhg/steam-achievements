import { db } from './db';
import pino from 'pino';

const logger = pino();

export async function createTables() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS webhooks (
        id SERIAL PRIMARY KEY,
        steam_id TEXT NOT NULL,
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

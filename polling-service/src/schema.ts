import { db } from './db';
import pino from 'pino';

const logger = pino();

export async function createTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS polling_queue (
        id SERIAL PRIMARY KEY,
        steamid TEXT NOT NULL,
        callback_url TEXT NOT NULL,
        initial BOOLEAN NOT NULL DEFAULT FALSE,
        status TEXT NOT NULL DEFAULT 'pending'
      );
    `);
    logger.info('Table created or already exists');
  }
  catch (e) {
    logger.error(e, 'Failed to query the database')
  }
}

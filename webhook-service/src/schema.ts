import { db } from './db';
import { logger } from './logger';

export async function createTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS webhooks (
      steam_id BIGINT PRIMARY KEY,
      callback_url TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  logger.info('Tables created (if not exist)');
}

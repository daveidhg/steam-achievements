import dotenv from 'dotenv';
import {Pool} from 'pg';
import pino from 'pino';

dotenv.config();
const logger = pino();

export const db = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.on('error', (e: Error) => {
    logger.error('Database connection error:', e);
});
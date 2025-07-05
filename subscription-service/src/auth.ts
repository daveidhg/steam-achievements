import { Request, Response, NextFunction } from "express";
import dotenv from 'dotenv';

dotenv.config();

export function requireAPIKey(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.headers['apikey'];
    if (apiKey !== process.env.API_KEY) {
        res.status(403).json({error: 'Forbidden: Invalid API key'})
        return;
    }
    next();
}
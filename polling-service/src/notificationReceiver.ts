import pino from "pino";
import { db } from "./db";
import dotenv from "dotenv";
import { Router, Request, Response } from "express";

dotenv.config();
const logger = pino();

export const router = Router();

router.post('/', async (req: Request, res: Response) => {
    const {steam_id, callback_url, initial} = req.body;
})



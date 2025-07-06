import express from 'express';
import dotenv from 'dotenv';
import { createTable } from './schema';
import pino from 'pino';
import { requireAPIKey } from './auth';
import { router as receiverRouter } from './requestHandler';

dotenv.config();
const logger = pino();
const app = express();
const port = process.env.PORT

app.use(express.json());
app.use(requireAPIKey);
app.use('/achievements', receiverRouter);

app.get('/', (req, res) => {
    res.send('Receiver service is running!');
});

createTable().then(() => {
    app.listen(port, () => {
        logger.info(`Receiver service is running on port ${port}`);
    })
});

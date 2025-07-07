import express from 'express';
import dotenv from 'dotenv';
import { createTable } from './schema';
import pino from 'pino';
import { router as receiverRouter } from './requestHandler';
import bodyParsesr from 'body-parser';

dotenv.config();
const logger = pino();
const app = express();
const port = process.env.PORT

app.use(express.json({limit: '2mb'}));
app.use('/achievements', receiverRouter);

app.get('/', (req, res) => {
    res.send('Receiver service is running!');
});

createTable().then(() => {
    app.listen(port, () => {
        logger.info(`Receiver service is running on port ${port}`);
    })
});

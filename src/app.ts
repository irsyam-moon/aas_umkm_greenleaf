import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import { notFound, errorHandler } from './middleware/error';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => res.json({ success: true, message: 'GreenLeaf API berjalan' }));
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

export default app;
import express from 'express';
import cors from 'cors';
import analyzeRouter from './routes/analyze';
import marketRouter from './routes/market';
import tradesRouter from './routes/trades';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

app.use('/api/analyze', analyzeRouter);
app.use('/api/market', marketRouter);
app.use('/api/trades', tradesRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;

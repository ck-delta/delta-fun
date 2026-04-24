import express from 'express';
import cors from 'cors';
import analyzeRouter from './routes/analyze';
import marketRouter from './routes/market';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '2mb' }));

app.use('/api/analyze', analyzeRouter);
app.use('/api/market', marketRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;

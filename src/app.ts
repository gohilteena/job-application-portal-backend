import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler, notFound } from './middlewares/error';
import apiRouter from './modules';

const app = express();
app.set('trust proxy', 1); // Render runs behind a proxy

const origins = (env.CORS_ORIGIN ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: origins.length ? origins : true }));
app.use(express.json({ limit: '1mb' }));
if (env.NODE_ENV !== 'test') app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const health: express.RequestHandler = (_req, res) => {
  const ok = mongoose.connection.readyState === 1;
  res.status(ok ? 200 : 503).json({
    success: ok,
    message: ok ? 'API is healthy' : 'Database not connected',
    data: {
      status: ok ? 'ok' : 'degraded',
      database: ok ? 'connected' : 'disconnected',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  });
};
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Job Application Portal API is running",
  });
});
app.get('/health', health);
app.get('/api/health', health);

app.use('/api', apiRouter);

app.use(notFound);
app.use(errorHandler);

export default app;

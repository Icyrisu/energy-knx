import express, { Express } from 'express';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { createRateLimiter } from './middleware/rateLimiter.js';
import { apiRouter } from './routes/api.js';
import { internalRouter } from './routes/internal.js';

export function createApp(): Express {
  const app = express();

  // Body parser with strict payload size limit (32KB max for telemetry)
  app.use(express.json({ limit: '32kb' }));

  // General rate limiter for public API (300 requests/min per IP)
  const apiLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 300,
    message: 'API rate limit exceeded. Please reduce request frequency.',
  });

  // Mount API routers
  app.use('/api/internal', internalRouter);
  app.use('/api', apiLimiter, apiRouter);

  // Not found and error handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

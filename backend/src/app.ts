import express, { Express } from 'express';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiRouter } from './routes/api.js';
import { internalRouter } from './routes/internal.js';

export function createApp(): Express {
  const app = express();

  // Body parser with strict payload size limit (32KB max for telemetry)
  app.use(express.json({ limit: '32kb' }));

  // Mount API routers
  app.use('/api/internal', internalRouter);
  app.use('/api', apiRouter);

  // Not found and error handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

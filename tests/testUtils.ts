import express from 'express';
import router from '../src/routes/controllerRoutes';
import { errorHandler } from '../src/middleware/errorHandler';

/**
 * Creates an Express application configured with the project routes and error
 * handler. Used within the Jest test suite.
 */
export function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', router);
  app.use(errorHandler);
  return app;
}

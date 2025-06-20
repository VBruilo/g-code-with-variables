import express from 'express';
import router from '../src/routes/controllerRoutes';
import { errorHandler } from '../src/middleware/errorHandler';

export function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', router);
  app.use(errorHandler);
  return app;
}

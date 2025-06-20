import express from 'express';
import router from '../src/routes/controllerRoutes';

export function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', router);
  return app;
}

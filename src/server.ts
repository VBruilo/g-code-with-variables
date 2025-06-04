// src/server.ts
import express, { Request, Response } from 'express';
import controllerRoutes from './routes/controllerRoutes';


/**
 * Initializes the Express application. The server will listen on the
 * `PORT` environment variable when provided or fall back to the default
 * port `3000`. The application also exposes the `/health` route that can
 * be used to verify that the service is running.
 */
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

/**
 * Registers controller routes under the `/api` path.
 */
app.use('/api', controllerRoutes);

/**
 * Health check endpoint used by monitoring services.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @returns A JSON object containing service status information.
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK' });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

 
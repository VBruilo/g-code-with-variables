import { Request, Response, NextFunction } from 'express';

/**
 * Express error handling middleware that logs errors and returns
 * a standardized JSON response.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  console.error(`[${req.method} ${req.path}]`, err);
  const status = typeof err.status === 'number' ? err.status : 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
}

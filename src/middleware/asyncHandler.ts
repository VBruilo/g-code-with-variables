import { RequestHandler } from 'express';

/**
 * Utility to wrap async route handlers and forward errors
 * to Express error handling middleware.
 */
export function asyncHandler(fn: (...args: any[]) => Promise<unknown>): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

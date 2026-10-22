import crypto from 'node:crypto';
import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';

export function internalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const secretHeader = req.headers['x-internal-secret'];

  if (!secretHeader || typeof secretHeader !== 'string') {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid X-Internal-Secret header',
      },
    });
    return;
  }

  const expectedBuffer = Buffer.from(env.INTERNAL_API_SECRET);
  const providedBuffer = Buffer.from(secretHeader);

  if (
    expectedBuffer.length !== providedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid internal authentication secret',
      },
    });
    return;
  }

  next();
}

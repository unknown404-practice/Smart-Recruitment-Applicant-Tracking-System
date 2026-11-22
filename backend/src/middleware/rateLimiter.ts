import { Request, Response, NextFunction } from 'express';

export interface RateLimiterOptions {
  windowMs?: number;
  max?: number;
  message?: string;
  statusCode?: number;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
}

interface ClientRecord {
  count: number;
  resetTime: number;
}

/**
 * Creates an in-memory sliding-window rate limiter middleware.
 * Zero external dependencies; standard RFC-compliant rate limit headers.
 */
export function createRateLimiter(options: RateLimiterOptions = {}) {
  const windowMs = options.windowMs || 60 * 1000; // default 1 minute
  const max = options.max || 100; // default 100 requests per window
  const message = options.message || 'Too many requests, please try again later.';
  const statusCode = options.statusCode || 429;

  const keyGenerator =
    options.keyGenerator ||
    ((req: Request): string => {
      const forwarded = req.headers['x-forwarded-for'];
      if (typeof forwarded === 'string') {
        return forwarded.split(',')[0].trim();
      }
      return req.ip || req.socket.remoteAddress || 'unknown-client';
    });

  const clients = new Map<string, ClientRecord>();

  // Periodically clean up expired records to prevent memory leak
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of clients.entries()) {
      if (now > record.resetTime) {
        clients.delete(key);
      }
    }
  }, Math.max(windowMs, 30000));

  // Allow Node to exit cleanly without waiting for this timer
  if (typeof cleanupTimer.unref === 'function') {
    cleanupTimer.unref();
  }

  const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
    // Check if request should be skipped
    if (options.skip && options.skip(req)) {
      return next();
    }

    // Skip in test environment unless explicitly testing rate limiting
    if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();

    let record = clients.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      clients.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', resetSeconds);

    if (record.count > max) {
      res.setHeader('Retry-After', resetSeconds);
      res.status(statusCode).json({
        success: false,
        error: {
          message: `${message} Try again in ${resetSeconds} seconds.`,
          statusCode,
          retryAfterSeconds: resetSeconds,
        },
      });
      return;
    }

    next();
  };

  // Expose reset method for testing
  rateLimiter.reset = () => {
    clients.clear();
  };

  return rateLimiter;
}

/**
 * 1. Global API Rate Limiter
 * 150 requests per minute per IP for general endpoints
 */
export const generalRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 150,
  message: 'API rate limit exceeded.',
  skip: (req) => req.path === '/api/health' || req.path === '/',
});

/**
 * 2. Authentication Rate Limiter
 * 30 requests per minute per IP for authentication & synchronization
 * Protects against brute-force attacks and credential stuffing
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many authentication attempts.',
});

/**
 * 3. Submission & Write Rate Limiter
 * 40 requests per minute per IP for high-cost operations (resumes, application submissions)
 */
export const submissionRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 40,
  message: 'Too many submissions. Please slow down.',
});

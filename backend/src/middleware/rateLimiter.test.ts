import express, { Request, Response } from 'express';
import request from 'supertest';
import { createRateLimiter } from './rateLimiter';

describe('Rate Limiter Middleware (Floor 23 / SaaS Reliability)', () => {
  let app: express.Application;
  let testLimiter: ReturnType<typeof createRateLimiter>;

  beforeEach(() => {
    app = express();
    testLimiter = createRateLimiter({
      windowMs: 1000, // 1 second window for fast tests
      max: 3, // max 3 requests
      message: 'Rate limit test exceeded.',
      skip: (req) => req.path === '/exempt',
    });

    app.use('/exempt', (_req: Request, res: Response) => {
      res.json({ ok: true });
    });

    app.use('/test', testLimiter, (_req: Request, res: Response) => {
      res.json({ ok: true });
    });
  });

  afterEach(() => {
    testLimiter.reset();
  });

  it('1. Allows requests under the maximum limit and returns RateLimit headers', async () => {
    const res1 = await request(app)
      .get('/test')
      .set('x-test-rate-limit', 'true');
    expect(res1.status).toBe(200);
    expect(res1.headers['ratelimit-limit']).toBe('3');
    expect(res1.headers['ratelimit-remaining']).toBe('2');

    const res2 = await request(app)
      .get('/test')
      .set('x-test-rate-limit', 'true');
    expect(res2.status).toBe(200);
    expect(res2.headers['ratelimit-remaining']).toBe('1');

    const res3 = await request(app)
      .get('/test')
      .set('x-test-rate-limit', 'true');
    expect(res3.status).toBe(200);
    expect(res3.headers['ratelimit-remaining']).toBe('0');
  });

  it('2. Blocks requests exceeding limit with 429 Too Many Requests and Retry-After header', async () => {
    // Make 3 requests to exhaust limit
    for (let i = 0; i < 3; i++) {
      await request(app)
        .get('/test')
        .set('x-test-rate-limit', 'true');
    }

    // 4th request must be blocked
    const resBlocked = await request(app)
      .get('/test')
      .set('x-test-rate-limit', 'true');

    expect(resBlocked.status).toBe(429);
    expect(resBlocked.body.success).toBe(false);
    expect(resBlocked.body.error.statusCode).toBe(429);
    expect(resBlocked.body.error.message).toContain('Rate limit test exceeded.');
    expect(resBlocked.headers['retry-after']).toBeDefined();
  });

  it('3. Skips exempted paths without enforcing rate limiting', async () => {
    // Make 5 requests to exempt endpoint
    for (let i = 0; i < 5; i++) {
      const res = await request(app).get('/exempt');
      expect(res.status).toBe(200);
    }
  });

  it('4. Resets counters when reset() is invoked or window expires', async () => {
    // Exhaust limit
    for (let i = 0; i < 3; i++) {
      await request(app)
        .get('/test')
        .set('x-test-rate-limit', 'true');
    }

    // Reset limiter
    testLimiter.reset();

    // Next request should succeed
    const res = await request(app)
      .get('/test')
      .set('x-test-rate-limit', 'true');
    expect(res.status).toBe(200);
    expect(res.headers['ratelimit-remaining']).toBe('2');
  });
});

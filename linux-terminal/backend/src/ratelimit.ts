import rateLimit from 'express-rate-limit';

export function createRateLimiter() {
  return rateLimit({
    windowMs: 60 * 1000,       // 1 minute
    max: 200,                   // requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please slow down.' },
    skip: (req) => req.path === '/api/health',
  });
}

import rateLimit from 'express-rate-limit';

// Standard API rate limiter (100 requests per 15 minutes)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

// Strict limiter for message sending or search
export const actionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Rate Limit Exceeded',
    message: 'You are performing actions too quickly. Please slow down.',
  },
});

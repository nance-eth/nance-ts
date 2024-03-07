import rateLimit from "express-rate-limit";

export const limiter = rateLimit({
  // 100 requests per minute
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  keyGenerator: (req) => {
    console.log('[RLRL] Request headers:', req.headers);
    return req.headers['x-forwarded-for'] as string;
  },
});

export const logHeadersOnRateLimit = (req: any, res: any, next: any) => {
  if (res.statusCode === 429) {
    console.log('Rate limit exceeded. Headers:', req.headers);
  }
  next();
};

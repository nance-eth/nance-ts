import rateLimit from "express-rate-limit";

export const limiter = rateLimit({
  // 20 seconds
  windowMs: 20 * 1000,
  max: 10,
  message: 'Too many requests from this IP, please try again later.',
});

export const logHeadersOnRateLimit = (req: any, res: any, next: any) => {
  if (res.statusCode === 429) {
    console.log('Rate limit exceeded. Headers:', req.headers);
  }
  next();
};

import rateLimit from "express-rate-limit";

export const limiter = rateLimit({
  // 20 seconds
  windowMs: 20 * 1000,
  max: 10,
  // message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.error(`Rate limit exceeded. IP: ${req.ip || req.ips[0]}, URL: ${req.url}`);
    res.status(429).send('too many requests.');
  },
});

import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";

export const limiter = rateLimit({
  // 20 seconds
  windowMs: 20 * 1000,
  max: 10,
  // message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const ip = req.ip || req.ips[0];
    console.error(`SUS IP: ${ip}`);
    res.status(429).send('too many requests.');
  },
});

export const ipFilter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.ips[0];
  console.log(`Client connected with IP address: ${ip}`);
  console.log(`Request URL: ${req.url}`);
  console.log('==============================================');
  next();
};

import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";

const bannedIps: string[] = [];

export const limiter = rateLimit({
  // 20 seconds
  windowMs: 20 * 1000,
  max: 10,
  // message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const ip = req.ip || req.ips[0];
    if (bannedIps.includes(ip)) {
      res.status(403).send('you banned.');
      return;
    }
    console.error(`Rate limit exceeded. IP: ${ip}, URL: ${req.url}`);
    bannedIps.push(ip);
    console.error(`Banned IPs: ${bannedIps}`);
    res.status(429).send('too many requests.');
  },
});

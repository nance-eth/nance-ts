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
    console.error(`Rate limit exceeded. IP: ${ip}, URL: ${req.url}`);
    console.error('Banned IPs:', bannedIps);
    bannedIps.push(ip);
    res.status(429).send('too many requests.');
  },
});

export const ipBan = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.ips[0];
  if (bannedIps.includes(ip)) {
    console.error(`JUST BANNED THIS IP: ${ip}`);
    res.status(403).send('you banned.');
    return;
  }
  console.log(`Client connected with IP address: ${req.ip || req.ips[0]}`);
  console.log(`Request URL: ${req.url}`);
  console.log('==============================================');
  next();
};

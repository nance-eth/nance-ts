import { Router, Request, Response, NextFunction } from "express";

const router = Router();

router.use((req: Request, res: Response, next: NextFunction) => {
  const address = req.headers.authorization;
  res.locals = { address };
  next();
});

export default router;

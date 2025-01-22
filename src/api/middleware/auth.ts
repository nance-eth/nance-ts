import { Router, Request, Response, NextFunction } from "express";
import { addressFromHeader } from "@/api/helpers/auth";

const router = Router();

router.use("/", async (req: Request, res: Response, next: NextFunction) => {
  const address = await addressFromHeader(req);
  res.locals = { address };
  next();
});

export default router;

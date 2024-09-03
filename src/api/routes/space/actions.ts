import { Router, Request, Response } from "express";

const router = Router({ mergeParams: true });

router.get('/', (req: Request, res: Response) => {
  const { space } = req.params;
  res.send(`Hello ${space}`);
});

export default router;

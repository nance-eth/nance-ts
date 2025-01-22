import { Router, Request, Response } from "express";
import { SpaceMiddleware } from "@/api/middleware/types";
import { buildJBReconfiguration } from "@/api/helpers/juicebox";
import { gatherPayouts } from "@/tasks/sendBookkeeping";

const router = Router({ mergeParams: true });

router.get('/', async (req: Request, res: Response) => {
  const { space } = req.params;
  const allowedSpaces = ["juicebox", "waterbox"];
  if (!allowedSpaces.includes(space)) {
    return res.json({ success: false, error: 'reconfig only allowed for juicebox and waterbox' });
  }
  try {
    const { currentCycle } = res.locals as SpaceMiddleware;
    const payouts = await gatherPayouts(space, currentCycle);
    if (!payouts) return res.json({ success: false, error: 'no payouts found' });
    const data = buildJBReconfiguration(payouts);
    return res.json({ success: true, data });
  } catch (e: any) {
    console.error("Could not reconfigure juicebox project", e);
    return res.json({ success: false, error: e.toString() });
  }
});

export default router;

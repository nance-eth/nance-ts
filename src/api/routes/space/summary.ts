import { Router, Request, Response } from "express";
import { SpaceMiddleware } from "@/api/middleware/types";
import { getSummary } from "@/nancearizer";
import { clearCache } from "@/api/helpers/cache";

const router = Router({ mergeParams: true });

router.get("/:type/:pid", async (req: Request, res: Response) => {
  try {
    const { space, type, pid } = req.params;
    const { dolt } = res.locals as SpaceMiddleware;
    if (type !== "proposal" && type !== "thread") throw Error("Invalid summary type");

    const summary = await getSummary(space, pid, type);
    const proposal = await dolt.getProposalByAnyId(pid);
    await dolt.updateSummary(proposal.uuid, summary, type);
    res.json({ success: true, data: summary });
    clearCache(space);
  } catch (e: any) {
    res.json({ success: false, error: e.toString() });
  }
});

export default router;

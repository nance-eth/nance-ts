import { Router, Request, Response } from "express";
import { Middleware } from "./middleware";
import { getSummary } from "@/nancearizer";

const router = Router({ mergeParams: true });

router.get("/:type/:pid", async (req: Request, res: Response) => {
  try {
    const { space, type, pid } = req.params;
    const { dolt } = res.locals as Middleware;
    if (type !== "proposal" && type !== "thread") throw Error("Invalid summary type");

    const summary = await getSummary(space, pid, type);
    const proposal = await dolt.getProposalByAnyId(pid);
    await dolt.updateSummary(proposal.uuid, summary, type);
  } catch (e: any) {
    res.json({ success: false, error: e.toString() });
  }
});

export default router;

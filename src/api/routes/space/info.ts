import { SpaceInfo } from "@nance/nance-sdk";
import { Router, Request, Response } from "express";
import { headToUrl } from "@/dolt/doltAPI";
import { Middleware } from "./middleware";
import { clearCache } from "@/api/helpers/cache";

const router = Router({ mergeParams: true });

router.get('/', async (_, res: Response) => {
  try {
    const {
      name,
      displayName,
      avatarURL,
      config,
      currentCycle,
      currentCycleDay,
      currentEvent,
      nextEvents,
      spaceOwners,
      nextProposalId,
      cycleStartDate
    } = res.locals as Middleware;
    const dolthubLink = headToUrl(config.dolt.owner, config.dolt.repo);
    const spaceInfo: SpaceInfo = {
      name,
      displayName,
      avatarURL,
      currentCycle,
      currentCycleDay,
      currentEvent,
      nextEvents,
      spaceOwners,
      snapshotSpace: config.snapshot.space,
      juiceboxProjectId: config.juicebox.projectId,
      dolthubLink,
      nextProposalId,
      cycleStartDate,
    };
    if (config.juicebox.gnosisSafeAddress || config.juicebox.governorAddress) {
      spaceInfo.transactorAddress = {
        type: config.juicebox.gnosisSafeAddress ? 'safe' : 'governor',
        network: config.juicebox.network,
        address: config.juicebox.gnosisSafeAddress || config.juicebox.governorAddress,
      };
    }
    return res.json({
      success: true,
      data: spaceInfo
    });
  } catch (e) {
    return res.send({ success: false, error: `[NANCE ERROR]: ${e}` });
  }
});

router.get("/cache/clear", async (req: Request, res: Response) => {
  const { space } = req.params;
  clearCache(space);
  res.json({ success: true });
});

export default router;

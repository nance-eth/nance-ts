import {
  Router,
  Request,
  Response,
  NextFunction
} from "express";
import { merge } from "lodash";
import { SpaceInfoExtended } from "@nance/nance-sdk";
import { DoltHandler } from "@/dolt/doltHandler";
import { getDb, getSysDb } from "@/dolt/pools";
import { cache } from "@/api/helpers/cache";
import { getSpaceInfo } from "@/api/helpers/getSpace";

const router = Router({ mergeParams: true });

export interface Middleware extends SpaceInfoExtended {
  dolt: DoltHandler;
  address?: string;
  nextProposalId: number;
}

router.use("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doltSys = getSysDb();
    // const auth = req?.headers?.authorization;
    // Send author through headers for testing
    const address = req.headers.authorization;
    const { space } = req.params;
    const query = space.toLowerCase();
    const dolt = getDb(query);

    let spaceInfo = cache[query]?.spaceInfo;
    const now = new Date().toISOString();
    const currentEventEnd = spaceInfo?.currentEvent?.end;
    const refresh = currentEventEnd ? now > currentEventEnd : false;
    if (!spaceInfo || refresh) {
      console.log(`[CACHE] refreshing ${query}`);
      const spaceConfig = await doltSys.getSpaceConfig(query);
      spaceInfo = getSpaceInfo(spaceConfig);
      const { "override-space-info": overrideSpaceInfo } = req.headers as { "override-space-info": string };
      if (overrideSpaceInfo) {
        const override = JSON.parse(overrideSpaceInfo);
        if (override) spaceInfo = merge(spaceInfo, override) as SpaceInfoExtended;
      }
      cache[query] = { spaceInfo };
    }

    // get nextProposalId
    let nextProposalId = cache[query]?.nextProposalId;
    if (!nextProposalId) {
      nextProposalId = await dolt.getNextProposalId();
      cache[query].nextProposalId = nextProposalId;
    }

    const locals: Middleware = {
      ...spaceInfo,
      dolt,
      address,
      nextProposalId
    };
    res.locals = locals;
    next();
  } catch (e: any) {
    res.json({ success: false, error: e.message || "Unknown error" });
  }
});

export default router;

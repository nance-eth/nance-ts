import {
  Router,
  Request,
  Response,
  NextFunction
} from "express";
import { SpaceInfoExtended } from "@nance/nance-sdk";
import { DoltHandler } from "@/dolt/doltHandler";
import { getDb, getSysDb } from "@/dolt/pools";
import { cache } from "@/api/helpers/cache";
import { getSpaceInfo } from "@/api/helpers/getSpace";
import { addressFromHeader } from "@/api/helpers/auth";
import { headToUrl } from "@/dolt/doltAPI";

const router = Router({ mergeParams: true });

export interface Middleware extends SpaceInfoExtended {
  dolt: DoltHandler;
  address?: string;
  nextProposalId: number;
  dolthubLink: string;
}

router.use("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doltSys = getSysDb();
    const { space } = req.params;
    const query = space.toLowerCase();
    const dolt = getDb(query);

    let dolthubLink = cache[query]?.dolthubLink || "";
    let spaceInfo = cache[query]?.spaceInfo;
    const now = new Date().toISOString();
    const currentEventEnd = spaceInfo?.currentEvent?.end;
    const refresh = currentEventEnd ? now > currentEventEnd : false;
    if (!spaceInfo || refresh) {
      console.log(`[CACHE] refreshing ${query}`);
      const spaceConfig = await doltSys.getSpaceConfig(query);
      const head = await dolt.getHead();
      dolthubLink = headToUrl(spaceConfig.config.dolt.owner, spaceConfig.config.dolt.repo, head);
      spaceInfo = getSpaceInfo(spaceConfig);
      cache[query] = { spaceInfo, dolthubLink };
    }

    const address = await addressFromHeader(req);

    // get nextProposalId
    let nextProposalId = cache[query]?.nextProposalId;
    if (!nextProposalId) {
      nextProposalId = await dolt.getNextProposalId();
      cache[query].nextProposalId = nextProposalId;
    }

    const locals: Middleware = {
      ...spaceInfo,
      dolt,
      dolthubLink,
      address,
      nextProposalId
    };
    res.locals = locals;
    console.log("address", locals.address);
    next();
  } catch (e: any) {
    res.json({ success: false, error: e.message || "Unknown error" });
  }
});

export default router;

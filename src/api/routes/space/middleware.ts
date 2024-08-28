import {
  Router,
  Request,
  Response,
  NextFunction
} from "express";
import { SpaceInfoExtended } from "@nance/nance-sdk";
import { DoltSysHandler } from "@/dolt/doltSysHandler";
import { DoltHandler } from "@/dolt/doltHandler";
import { pools } from "@/dolt/pools";
import { cache } from "@/api/helpers/cache";
import { getSpaceInfo } from "@/api/helpers/getSpace";
import { addressFromJWT } from "@/api/helpers/auth";

const router = Router({ mergeParams: true });
const doltSys = new DoltSysHandler(pools.nance_sys);

export interface Middleware extends SpaceInfoExtended {
  dolt: DoltHandler;
  address?: string;
  nextProposalId: number;
}

router.use("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = req?.headers?.authorization;
    const { space } = req.params;
    const query = space.toLowerCase();
    if (!Object.keys(pools).includes(query)) {
      throw new Error(`space ${query} not found`);
    }

    let spaceInfo = cache[query]?.spaceInfo;
    const now = new Date().toISOString();
    const currentEventEnd = spaceInfo?.currentEvent?.end;
    const refresh = currentEventEnd ? now > currentEventEnd : false;
    if (!spaceInfo || refresh) {
      console.log(`[CACHE] refreshing ${query}`);
      const spaceConfig = await doltSys.getSpaceConfig(query);
      spaceInfo = getSpaceInfo(spaceConfig);
      cache[query] = { spaceInfo };
    }

    const dolt = new DoltHandler(pools[query], spaceInfo.config.proposalIdPrefix);
    const jwt = auth?.split('Bearer ')[1];
    const address = (jwt && jwt !== 'null') ? await addressFromJWT(jwt) : undefined;

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

import { Router, Request, Response, NextFunction } from "express";
import { isNanceSpaceOwner } from "@/api/helpers/permissions";
import { addSecondsToDate } from "@/utils";
import * as tasks from "@/tasks";
import { clearCache } from "@/api/helpers/cache";
import { Middleware } from "./middleware";

const router = Router({ mergeParams: true });

// validate headers have valid JWT that is the spaceOwner before any other requests
router.use("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { space } = req.params;
    const { address, spaceOwners } = res.locals as Middleware;
    if (!address) { res.json({ success: false, error: "no SIWE address found" }); return; }
    if (!isNanceSpaceOwner(spaceOwners, address)) {
      res.json({ success: false, error: `address ${address} is not a spaceOwner of ${space}` });
      return;
    }
    clearCache(space);
    next();
  } catch (e) {
    res.json({ success: false, error: e });
  }
});

router.get("/dailyAlert", async (req: Request, res: Response) => {
  try {
    const { space } = req.params;
    await tasks.sendDailyAlert(space);
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, error: e });
  }
});

router.get("/incrementGovernanceCycle", async (req: Request, res: Response) => {
  try {
    const { space } = req.params;
    await tasks.incrementGovernanceCycle(space);
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, error: e });
  }
});

router.get("/temperatureCheckStart", async (req: Request, res: Response) => {
  try {
    const { endDate } = req.query as { endDate: string };
    const { space } = req.params;
    const { config, nextEvents } = res.locals as Middleware;
    const _temperatureCheckEndDate = endDate
      || nextEvents.find((e) => e.title === "Temperature Check")?.end
      || addSecondsToDate(new Date(), 3600);
    const temperatureCheckEndDate = new Date(_temperatureCheckEndDate);
    await tasks.temperatureCheckRollup(space, config, temperatureCheckEndDate);
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, error: e });
  }
});

router.get("/temperatureCheckClose", async (req: Request, res: Response) => {
  try {
    const { config } = res.locals as Middleware;
    const { space } = req.params;
    await tasks.temperatureCheckClose(space, config);
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, error: e });
  }
});

router.get("/voteSetup", async (req: Request, res: Response) => {
  try {
    const { endDate } = req.query as { endDate: string };
    const { space } = req.params;
    const { config, nextEvents } = res.locals as Middleware;
    const _voteEndDate = endDate
      || nextEvents.find((e) => e.title === "Snapshot Vote")?.end
      || addSecondsToDate(new Date(), 3600);
    const voteEndDate = new Date(_voteEndDate);
    const proposals = await tasks.voteSetup(space, config, voteEndDate);
    await tasks.voteRollup(space, config, voteEndDate, proposals);
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, error: e });
  }
});

router.get("/voteClose", async (req: Request, res: Response) => {
  try {
    const { config } = res.locals as Middleware;
    const { space } = req.params;
    const proposals = await tasks.voteClose(space, config);
    await tasks.voteResultsRollup(space, config, proposals);
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, error: e });
  }
});

router.get("/thread/reconfig", async (req: Request, res: Response) => {
  try {
    const { config } = res.locals as Middleware;
    const { space } = req.params;
    const payouts = await tasks.sendReconfigThread(space, config);
    res.json({ success: true, data: payouts });
  } catch (e) {
    res.json({ success: false, error: e });
  }
});

router.post("/thread/transactions", async (req: Request, res: Response) => {
  try {
    const { dolt } = res.locals as Middleware;
    const { actions } = req.body as { actions: string[] } // actions as a list of uuids
    const proposals = actions.flatMap(async (aid) => {
      return await dolt.getProposalByActionId(aid);
    });
    res.json({ success: true, data: proposals });
  } catch (e) {
    res.json({ success: false, error: e });
  }
});

export default router;

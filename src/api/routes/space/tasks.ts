/* eslint-disable no-await-in-loop */
import { Router, Request, Response, NextFunction } from "express";
import { ActionPacket, Action } from "@nance/nance-sdk";
import { isNanceSpaceOwner } from "@/api/helpers/permissions";
import { addSecondsToDate } from "@/utils";
import * as tasks from "@/tasks";
import { clearCache } from "@/api/helpers/cache";
import { Middleware } from "./middleware";
import { getActionPacket } from "@/api/helpers/proposal/actions";
import { discordTransactionThread } from "@/api/helpers/discord";

const router = Router({ mergeParams: true });

// validate headers have valid JWT that is the spaceOwner before any other requests
router.use("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { space } = req.params;
    const { address, spaceOwners } = res.locals as Middleware;
    if (!address) { res.json({ success: false, error: "no SIWE address found" }); return; }
    if (!isNanceSpaceOwner(spaceOwners, address)) {
      throw new Error(`address ${address} is not a spaceOwner of ${space}`);
    }
    clearCache(space);
    next();
  } catch (e: any) {
    res.json({ success: false, error: e });
  }
});

router.get("/dailyAlert", async (req: Request, res: Response) => {
  try {
    const { space } = req.params;
    await tasks.sendDailyAlert(space);
    res.json({ success: true });
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

router.get("/incrementGovernanceCycle", async (req: Request, res: Response) => {
  try {
    const { space } = req.params;
    await tasks.incrementGovernanceCycle(space);
    res.json({ success: true });
  } catch (e: any) {
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
  } catch (e: any) {
    res.json({ success: false, error: e });
  }
});

router.get("/temperatureCheckClose", async (req: Request, res: Response) => {
  try {
    const { config } = res.locals as Middleware;
    const { space } = req.params;
    await tasks.temperatureCheckClose(space, config);
    res.json({ success: true });
  } catch (e: any) {
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
  } catch (e: any) {
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
  } catch (e: any) {
    res.json({ success: false, error: e });
  }
});

router.get("/thread/reconfig", async (req: Request, res: Response) => {
  try {
    const { config } = res.locals as Middleware;
    const { space } = req.params;
    const payouts = await tasks.sendReconfigThread(space, config);
    res.json({ success: true, data: payouts });
  } catch (e: any) {
    res.json({ success: false, error: e });
  }
});

const validTransactionTypes: Action["type"][] = ["Custom Transaction", "Transfer"];
router.post("/thread/transactions", async (req: Request, res: Response) => {
  try {
    const { dolt, config, currentCycle } = res.locals as Middleware;
    const { actions, safeTxnUrl } = req.body as { actions: string[], safeTxnUrl: string };
    if (!actions) throw new Error("Must provide action uuids as body");
    const actionPackets: ActionPacket[] = [];
    for (let i = 0; i < actions.length; i += 1) {
      const aid = actions[i];
      const proposal = await dolt.getProposalByActionId(aid);
      const actionPacket = getActionPacket(proposal, aid);
      if (!actionPacket.action.actionTracking) throw new Error("Action not initialized");
      if (proposal != null &&
        validTransactionTypes.includes(actionPacket.action.type)
      ) actionPackets.push(actionPacket);
    }
    if (actionPackets.length === 0) throw new Error("No valid proposals found");
    const safeUrl = safeTxnUrl || `https://app.safe.global/home?safe=eth:${config.juicebox.gnosisSafeAddress}`;
    const data = await discordTransactionThread(config, currentCycle, safeUrl, actionPackets);
    res.json({ success: true, data });
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

export default router;

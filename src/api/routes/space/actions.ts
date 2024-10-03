import { Router, Request, Response, NextFunction } from "express";
import { ActionPacket, ActionStatusNames, Proposal } from "@nance/nance-sdk";
import { Middleware } from "./middleware";
import { discordLogin } from "@/api/helpers/discord";
import { initActionTrackingStruct } from "@/tasks/helpers/actionTracking";
import { clearCache } from "@/api/helpers/cache";

const router = Router({ mergeParams: true });
export const viableActions = ActionStatusNames.filter((status) => status !== "Executed" && status !== "Cancelled");
type ActionMiddleware = Middleware & { actionPacket: ActionPacket, proposal: Proposal };

// GET /:space/actions
router.get("/", async (_: Request, res: Response) => {
  try {
    const { dolt } = res.locals as Middleware;
    const { proposals } = await dolt.getProposals({ actionTrackingStatus: viableActions });
    const actionsPacket: ActionPacket[] = proposals.flatMap((proposal) => {
      if (!proposal.actions) return [];
      return proposal.actions.map((action) => ({
        proposal: {
          title: proposal.title,
          id: Number(proposal.proposalId),
        },
        action
      }));
    });
    res.json({ success: true, data: actionsPacket });
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

// action ID (aid) middleware
router.use("/:aid", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { aid } = req.params;
    const { dolt } = res.locals as Middleware;
    const proposal = await dolt.getProposalByActionId(aid);
    if (!proposal || !proposal.proposalId) throw Error(`No proposal found containing action id ${aid}`);
    const action = proposal?.actions?.find((a) => a?.uuid === aid);
    if (!action) throw Error("Action not found");
    const actionPacket: ActionPacket = {
      action,
      proposal: {
        title: proposal.title,
        id: proposal.proposalId
      }
    };
    res.locals.actionPacket = actionPacket;
    res.locals.proposal = proposal;
    next();
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

// GET /:space/actions/:aid
router.get("/:aid", async (_: Request, res: Response) => {
  try {
    const { actionPacket } = res.locals;
    res.json({ success: true, data: actionPacket });
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

// POST /:space/actions/init
// init actionTracking struct and save to database
router.get("/:aid/init", async (req: Request, res: Response) => {
  try {
    const { space } = req.params;
    const { dolt, proposal, currentCycle } = res.locals as ActionMiddleware;
    const actionTracking = initActionTrackingStruct(proposal, currentCycle);
    const data = await dolt.updateActionTracking(proposal.uuid, actionTracking);
    clearCache(space);
    res.json({ success: true, data });
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

// POST /:space/actions/:uuid/poll
router.post("/:aid/poll", async (req: Request, res: Response) => {
  try {
    const { space } = req.params;
    const { dolt, config, actionPacket, proposal } = res.locals as ActionMiddleware;
    if (!proposal.actions) throw new Error("Proposal actions are undefined");
    if (!actionPacket.action.pollRequired) throw new Error("Action does not require a poll");
    if (actionPacket.action.actionTracking?.some((at) => at.status !== "Poll Required")) {
      throw new Error("Poll already run");
    }

    const discord = await discordLogin(config);
    const pollId = await discord.sendProposalActionPoll(proposal);
    const updatedActionTracking = proposal.actions.map((a) => {
      if (!a.actionTracking) throw new Error("Action tracking is undefined");
      if (a.uuid === actionPacket.action.uuid) {
        const status = ActionStatusNames[2]; // "Polling", works better for type checking
        return a.actionTracking.map((tracking) => ({ ...tracking, pollId, status }));
      }
      return a.actionTracking;
    });
    await dolt.updateActionTracking(proposal.uuid, updatedActionTracking);
    clearCache(space);
    res.json({ success: true, data: pollId });
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

export default router;

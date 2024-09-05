import { Router, Request, Response } from "express";
import { ActionStatusNames } from "@nance/nance-sdk";
import { Middleware } from "./middleware";
import { discordLogin } from "@/api/helpers/discord";

const router = Router({ mergeParams: true });
const viableActions = ActionStatusNames.filter((status) => status !== "Executed" && status !== "Cancelled");

// GET /:space/actions
router.get("/", async (req: Request, res: Response) => {
  try {
    const { dolt } = res.locals as Middleware;
    const { proposals } = await dolt.getProposals({ actionTrackingStatus: viableActions });
    const actionsPacket = proposals.flatMap((proposal) => {
      if (!proposal.actions) return [];
      return proposal.actions.map((action) => ({
        proposalTitle: proposal.title,
        proposalId: proposal.proposalId,
        ...action,
      }));
    });
    res.json({ success: true, data: actionsPacket });
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

// GET /:space/actions/:pid/:uuid/poll
router.get("/:pid/:uuid/poll", async (req: Request, res: Response) => {
  try {
    const { dolt, config } = res.locals as Middleware;
    const { pid, uuid } = req.params;
    const proposal = await dolt.getProposalByAnyId(pid);
    if (!proposal) throw new Error("Proposal not found");
    const action = proposal.actions?.find((a) => a.uuid === uuid);
    if (!action) throw new Error("Action not found");
    if (!action.pollRequired) throw new Error("Action does not require a poll");
    const discord = await discordLogin(config);
    await discord.sendProposalActionPoll(proposal);
    res.json({ success: true, data: action });
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

export default router;

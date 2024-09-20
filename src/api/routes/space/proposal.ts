import { Router, Request, Response } from "express";
import {
  Proposal,
  ProposalDeleteRequest,
  ProposalPacket,
  ProposalStatus,
  ProposalStatusNames,
  ProposalUpdateRequest
} from "@nance/nance-sdk";
import { Middleware } from "./middleware";
import { clearCache, findCacheProposal } from "@/api/helpers/cache";
import { discordEditProposal, discordLogin } from "@/api/helpers/discord";
import { validateUploaderAddress } from "@/api/helpers/snapshotUtils";
import { canEditProposal } from "@/api/helpers/permissions";
import { checkPermissions, validateUploaderVp } from "@/api/helpers/proposal/validateProposal";
import { buildProposal } from "@/api/helpers/proposal/buildProposal";
import { logProposal } from "@/api/helpers/proposal/logProposal";
import { getProposalsWithVotes, votePassCheck } from "@/tasks/helpers/voting";

const router = Router({ mergeParams: true });

// GET /:space/proposal/:pid
router.get("/:pid", async (req: Request, res: Response) => {
  const { space, pid } = req.params;
  const { dolt, config, nextProposalId } = res.locals as Middleware;
  let proposal: Proposal | undefined;
  try {
    const proposalInfo = {
      proposalIdPrefix: config.proposalIdPrefix,
      minTokenPassingAmount: config.snapshot.minTokenPassingAmount,
      snapshotSpace: config.snapshot.space,
      nextProposalId
    };

    proposal = findCacheProposal(space, pid) || await dolt.getProposalByAnyId(pid);
    if (!proposal) throw new Error("Proposal not found");
    const data: ProposalPacket = { ...proposal, proposalInfo };
    res.json({ success: true, data });
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

// POST /:space/proposal/:pid/discussion
router.get("/:pid/discussion", async (req: Request, res: Response) => {
  try {
    const { space, pid } = req.params;
    const { dolt } = res.locals as Middleware;
    const proposal = await dolt.getProposalByAnyId(pid);
    if (!proposal) throw new Error("Proposal not found");
    const discord = await discordLogin(res.locals.config);
    let discussionThreadURL;
    if (!proposal.discussionThreadURL) {
      discussionThreadURL = await discord.startDiscussion(proposal);
      await dolt.updateDiscussionURL({ ...proposal, discussionThreadURL });
    }
    discussionThreadURL = proposal.discussionThreadURL;
    await discord.editDiscussionMessage(proposal, true);
    discord.logout();
    clearCache(space);
    res.json({ success: true, data: discussionThreadURL });
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

// PUT /:space/proposal/:pid
router.put("/:pid", async (req: Request, res: Response) => {
  try {
    const { space, pid } = req.params;
    const { proposal, envelope } = req.body as ProposalUpdateRequest;
    const { dolt, config, address, spaceOwners, currentCycle, currentEvent, nextProposalId } = res.locals as Middleware;

    const proposalInDb = await dolt.getProposalByAnyId(pid);
    console.log("PROPOSAL IN DB")
    console.log(proposalInDb)
    if (!canEditProposal(proposalInDb.status)) throw Error("Proposal is no longer editable");

    const { uploaderAddress, receipt, snapshotId } = await validateUploaderAddress(address, envelope);
    checkPermissions(proposal, proposalInDb, uploaderAddress, spaceOwners, "archive");
    const { authorAddress, coauthors, status } = await validateUploaderVp({ proposal, proposalInDb, uploaderAddress, config });

    const updateProposal = buildProposal({
      proposal,
      proposalInDb,
      status,
      authorAddress,
      coauthors,
      snapshotId,
      currentCycle,
      currentEvent,
      nextProposalId,
      config,
    });
    logProposal(updateProposal, space, uploaderAddress, "edit");
    const uuid = await dolt.editProposal(updateProposal, receipt);
    // return uuid to client, then continue doing things
    res.json({ success: true, data: { uuid } });

    clearCache(space);
    try {
      const discussionThreadURL = await discordEditProposal(updateProposal, proposalInDb, config);
      if (discussionThreadURL) await dolt.updateDiscussionURL({ ...updateProposal, discussionThreadURL });
    } catch {
      console.error("something went wrong with Discord send");
    }
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

// PATCH /:space/proposal/:pid/status
router.patch("/:pid/status/:status", async (req: Request, res: Response) => {
  try {
    const { space, pid, status } = req.params as { space: string, pid: string, status: ProposalStatus };
    if (!ProposalStatusNames.includes(status)) throw Error("Invalid proposal status");
    const { dolt, address, spaceOwners } = res.locals as Middleware;
    const proposalInDb = await dolt.getProposalByAnyId(pid);
    if (!proposalInDb) throw Error("Proposal not found");
    if (!address) throw Error("Must supply jwt address to change status");
    checkPermissions(proposalInDb, proposalInDb, address, spaceOwners, "admin");
    const uuid = await dolt.editProposal({ status, uuid: proposalInDb.uuid });
    res.json({ success: true, data: { uuid } });
    clearCache(space);
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

// PATCH /:space/proposal/:pid/sync
// sync snapshot results, admin only
router.patch("/:pid/sync", async (req: Request, res: Response) => {
  try {
    const { dolt, config, address, spaceOwners } = res.locals as Middleware;
    if (!address) throw Error("Must supply jwt address to change status");
    const { pid } = req.params;
    const proposal = await dolt.getProposalByAnyId(pid);
    if (!proposal) return;
    checkPermissions(proposal, proposal, address, spaceOwners, "admin");
    const [proposalWithVoteResults] = await getProposalsWithVotes(config, [proposal]);
    if (!proposalWithVoteResults.voteResults) throw Error("Error fetching vote results");
    const pass = (votePassCheck(config, proposalWithVoteResults.voteResults));
    const outcomeStatus = pass ? "Approved" : "Cancelled";
    const updatedProposal: Proposal = {
      ...proposal,
      status: outcomeStatus,
      voteResults: proposalWithVoteResults.voteResults
    };
    await dolt.updateVotingClose(updatedProposal);
    res.json({ success: true });
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

// DELETE /:space/proposal/:pid
router.delete("/:pid", async (req: Request, res: Response) => {
  try {
    const { space, pid } = req.params;
    const { envelope } = req.body as ProposalDeleteRequest;
    const { dolt, config, spaceOwners, address } = res.locals as Middleware;
    const proposalInDb = await dolt.getProposalByAnyId(pid);
    if (!proposalInDb) throw Error("Proposal not found");
    if (!canEditProposal(proposalInDb.status)) throw Error("Proposal is no longer editable");

    const { uploaderAddress } = await validateUploaderAddress(address, envelope);
    checkPermissions(proposalInDb, proposalInDb, uploaderAddress, spaceOwners, "delete");

    logProposal(proposalInDb, space, uploaderAddress, "delete");
    dolt.deleteProposal(proposalInDb.uuid).then(async (affectedRows: number) => {
      res.json({ success: true, data: { affectedRows } });
      clearCache(space);
      try {
        const discord = await discordLogin(config);
        await discord.sendProposalDelete(proposalInDb);
        discord.logout();
      } catch (e) { console.error(`[DISCORD] ${e}`); }
    });
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

export default router;

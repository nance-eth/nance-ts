import { Router, Request, Response } from "express";
import { isEqual } from "lodash";
import {
  Proposal,
  ProposalDeleteRequest,
  ProposalPacket,
  ProposalUpdateRequest
} from "@nance/nance-sdk";
import { Middleware } from "./middleware";
import { clearCache, findCacheProposal } from "@/api/helpers/cache";
import { discordLogin } from "@/api/helpers/discord";
import { validateUploaderAddress } from "@/api/helpers/snapshotUtils";
import { getLastSlash } from "@/utils";
import { diffLineCounts } from "@/api/helpers/diff";
import { canEditProposal } from "@/api/helpers/permissions";
import { checkPermissions, validateUploaderVp } from "@/api/helpers/proposal/validateProposal";
import { buildProposal } from "@/api/helpers/proposal/buildProposal";
import { logProposal } from "@/api/helpers/proposal/logProposal";

const router = Router({ mergeParams: true });

// GET /:space/proposal/:pid
router.get('/:pid', async (req: Request, res: Response) => {
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
    res.send({ success: false, error: e.toString() });
  }
});

// POST /:space/proposal/:pid/discussion
router.post('/:pid/discussion', async (req: Request, res: Response) => {
  try {
    const { space, pid } = req.params;
    const { dolt } = res.locals as Middleware;
    const proposal = await dolt.getProposalByAnyId(pid);
    if (!proposal) throw new Error("Proposal not found");
    if (proposal.discussionThreadURL) throw new Error("Discussion thread already exists");
    const discord = await discordLogin(res.locals.config);
    const discussionThreadURL = await discord.startDiscussion(proposal);
    await dolt.updateDiscussionURL({ ...proposal, discussionThreadURL });
    discord.logout();
    clearCache(space);
    res.json({ success: true, discussionThreadURL });
  } catch (e: any) {
    res.send({ success: false, error: e.toString() });
  }
});

// PUT /:space/proposal/:pid
router.put('/:pid', async (req: Request, res: Response) => {
  try {
    const { space, pid } = req.params;
    const { proposal, envelope } = req.body as ProposalUpdateRequest;
    const { dolt, config, address, spaceOwners, currentCycle, currentEvent, nextProposalId } = res.locals as Middleware;

    const proposalInDb = await dolt.getProposalByAnyId(pid);
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
      const discord = await discordLogin(config);
      // if proposal moved from Draft to Discussion, send discord message
      const shouldCreateDiscussion = (
        (proposalInDb.status === "Draft")
        && status === "Discussion" && !proposalInDb.discussionThreadURL
      );
      if (shouldCreateDiscussion) {
        try {
          const discussionThreadURL = await discord.startDiscussion(updateProposal);
          if (authorAddress) await discord.setupPoll(getLastSlash(discussionThreadURL));
          await dolt.updateDiscussionURL({ ...updateProposal, discussionThreadURL });
        } catch (e) {
          console.error(`[DISCORD] ${e}`);
        }
      }

      // if proposal got sponsored by a valid author,
      // add Temperature Check embed and setup poll buttons
      if (proposalInDb.status === "Discussion" && updateProposal.status === "Temperature Check") {
        await discord.editDiscussionMessage(updateProposal);
        await discord.setupPoll(getLastSlash(proposalInDb.discussionThreadURL));
      }

      // archive alert
      if (proposal.status === "Archived") {
        try { await discord.sendProposalArchive(proposalInDb); } catch (e) { console.error(`[DISCORD] ${e}`); }
      }
      // unarchive alert
      if (proposal.status === config.proposalSubmissionValidation?.metStatus && proposalInDb.status === "Archived") {
        try { await discord.sendProposalUnarchive(proposalInDb); } catch (e) { console.error(`[DISCORD] ${e}`); }
      }

      // send diff to discord
      const diff = diffLineCounts(proposalInDb.body, proposal.body);
      const actionsChanged = !isEqual(proposalInDb.actions, proposal.actions);
      if (
        proposalInDb.discussionThreadURL &&
        (diff.added || diff.removed || actionsChanged)
      ) {
        updateProposal.discussionThreadURL = proposalInDb.discussionThreadURL;
        await discord.editDiscussionMessage(updateProposal);
        if (diff.added || diff.removed) await discord.sendProposalDiff(updateProposal, diff);
      }
      discord.logout();
    } catch (e) {
      console.error(`[DISCORD] ${space}`);
      console.error(`[DISCORD] ${e}`);
    }
  } catch (e: any) {
    res.json({ success: false, error: e.toString() });
  }
});

// DELETE /:space/proposal/:pid
router.delete('/:pid', async (req: Request, res: Response) => {
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
    }).catch((e) => {
      res.json({ success: false, error: e });
    });
  } catch (e: any) {
    res.json({ success: false, error: e.toString() });
  }
});

export default router;

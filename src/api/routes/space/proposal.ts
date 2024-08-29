import { Router, Request } from "express";
import { isEqual } from "lodash";
import {
  Proposal,
  ProposalDeleteRequest,
  ProposalPacket,
  ProposalUpdateRequest
} from "@nance/nance-sdk";
import { Middleware } from "./middleware";
import { clearCache, findCacheProposal } from "@/api/helpers/cache";
import { addressFromSignature } from "@/api/helpers/auth";
import { discordLogin } from "@/api/helpers/discord";
import { validateUploaderAddress } from "@/api/helpers/snapshotUtils";
import { getLastSlash } from "@/utils";
import { diffLineCounts } from "@/api/helpers/diff";
import {
  canEditProposal,
  isMultisig,
  isNanceAddress,
  isNanceSpaceOwner
} from "@/api/helpers/permissions";
import { checkPermissions, validateUploaderVp } from "@/api/helpers/proposal/validateProposal";
import { buildProposal } from "@/api/helpers/proposal/buildProposal";
import { logProposal } from "@/api/helpers/proposal/logProposal";

const router = Router({ mergeParams: true });

router.get('/:pid', async (req: Request, res) => {
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
    if (!proposal) throw Error();
    const data: ProposalPacket = { ...proposal, proposalInfo };
    res.json({ success: true, data });
  } catch (e) {
    res.send({ success: false, error: `[NANCE ERROR]: proposal ${pid} not found for space ${space}` });
  }
});

router.put('/:pid', async (req: Request, res) => {
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
        && proposal.status === "Discussion" && !proposalInDb.discussionThreadURL
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

router.delete('/:uuid', async (req: Request, res) => {
  try {
    const { space, uuid } = req.params;
    const { envelope } = req.body as ProposalDeleteRequest;
    const { dolt, config, spaceOwners, address } = res.locals as Middleware;
    const deleterAddress = address || envelope?.address;
    if (!deleterAddress) {
      res.json({ success: false, error: '[NANCE ERROR]: missing address for proposal delete' });
      return;
    }
    const proposalByUuid = await dolt.getProposalByAnyId(uuid);
    if (envelope && !address) {
      const decodedAddress = await addressFromSignature(envelope);
      if (deleterAddress !== decodedAddress) {
        res.json({
          success: false,
          error: `address and signature do not match\naddress: ${deleterAddress}\nsignature: ${decodedAddress}`
        });
        return;
      }
    }
    if (!proposalByUuid) {
      res.json({ success: false, error: '[NANCE ERROR]: proposal not found' });
      return;
    }
    if (!proposalByUuid) { throw new Error('proposal not found'); }
    if (!canEditProposal(proposalByUuid.status)) {
      res.json({ success: false, error: '[NANCE ERROR]: proposal edits no longer allowed' });
      return;
    }
    const permissions = (
      deleterAddress === proposalByUuid.authorAddress
      // for proposal that requires a sponsor,
      // authorAddress will be undefined and first coauthor will be original author
      || (!proposalByUuid.authorAddress && deleterAddress === proposalByUuid.coauthors?.[0])
      || await isMultisig(config.juicebox.gnosisSafeAddress, deleterAddress)
      || isNanceSpaceOwner(spaceOwners, deleterAddress)
      || isNanceAddress(deleterAddress)
    );

    if (permissions) {
      console.log(`DELETE issued by ${deleterAddress}`);
      dolt.deleteProposal(uuid).then(async (affectedRows: number) => {
        res.json({ success: true, data: { affectedRows } });
        clearCache(space);
        try {
          const discord = await discordLogin(config);
          await discord.sendProposalDelete(proposalByUuid);
          discord.logout();
        } catch (e) { console.error(`[DISCORD] ${e}`); }
      }).catch((e) => {
        res.json({ success: false, error: e });
      });
    } else {
      res.json({ success: false, error: '[PERMISSIONS] User not authorized to delete proposal' });
    }
  } catch (e: any) {
    res.json({ success: false, error: e.toString() });
  }
});

export default router;

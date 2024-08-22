import { Router, Request } from "express";
import { isEqual, uniq } from "lodash";
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
import { dotPin } from "@/storage/storageHandler";
import { formatSnapshotEnvelope, getSnapshotId } from "@/api/helpers/snapshotUtils";
import { getAddressVotingPower } from "@/snapshot/snapshotVotingPower";
import { getLastSlash } from "@/utils";
import { diffLineCounts } from "@/api/helpers/diff";
import {
  canEditProposal,
  isMultisig,
  isNanceAddress,
  isNanceSpaceOwner
} from "@/api/helpers/permissions";

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
    res.send({ success: false, error: '[NANCE ERROR]: proposal not found' });
  }
});

router.put('/:pid', async (req: Request, res) => {
  const { space, pid } = req.params;
  try {
    const { proposal, envelope } = req.body as ProposalUpdateRequest;
    const { dolt, config, bearerAddress, spaceOwners, currentCycle, currentEvent } = res.locals as Middleware;

    const proposalByUuid = await dolt.getProposalByAnyId(pid);
    if (!canEditProposal(proposalByUuid.status)) {
      res.json({ success: false, error: '[NANCE ERROR]: proposal edits no longer allowed' });
      return;
    }

    const uploaderAddress = bearerAddress || envelope?.address;
    if (!uploaderAddress) { res.json({ success: false, error: '[NANCE ERROR]: missing address for proposal upload' }); return; }
    let receipt: string | undefined;
    let snapshotId: string | undefined;
    // predetermine snapshotId
    // this allows us to upload the proposal and have proper authorship displayed on snapshot.org
    if (envelope && !bearerAddress) {
      const decodedAddress = await addressFromSignature(envelope);
      if (uploaderAddress !== decodedAddress) {
        res.json({
          success: false,
          error: `address and signature do not match\naddress: ${uploaderAddress}\nsignature: ${decodedAddress}`
        });
        return;
      }
      receipt = await dotPin(formatSnapshotEnvelope(envelope));
      snapshotId = getSnapshotId(envelope);
    }

    // only allow archives by original author, multisig, or spaceOwner
    const permissions = (
      uploaderAddress === proposalByUuid.authorAddress
      || await isMultisig(config.juicebox.gnosisSafeAddress, uploaderAddress)
      || isNanceSpaceOwner(spaceOwners, uploaderAddress)
    );
    const { status } = proposal;
    if (status === "Archived" && !permissions) {
      res.json({ success: false, error: '[PERMISSIONS] User not authorized to archive proposal' });
      return;
    }

    // check author snapshot voting power
    // if author doesn't meet the minimum balance, set author to undefined and add uploaderAddress to coauthors
    // then a valid author will need to resign the proposal to move it to Temperature Check
    let { authorAddress } = proposalByUuid;
    let authorMeetsValidation = false;
    let { coauthors } = proposal;
    const {
      proposalSubmissionValidation,
      allowCurrentCycleSubmission
    } = config;
    if (
      (status === "Discussion" || status === "Temperature Check") &&
      proposalSubmissionValidation
    ) {
      const { minBalance } = proposalSubmissionValidation;
      const balance = await getAddressVotingPower(uploaderAddress, config.snapshot.space);
      if (balance < minBalance) {
        coauthors = !coauthors ? [uploaderAddress] : uniq([...coauthors, uploaderAddress]);
        proposal.status = proposalSubmissionValidation.notMetStatus;
      } else {
        authorMeetsValidation = true;
        if (proposal.status === "Discussion") proposal.status = proposalSubmissionValidation.metStatus;
        if (!authorAddress) authorAddress = uploaderAddress;
        if (uploaderAddress !== authorAddress) coauthors = !coauthors ? [uploaderAddress] : uniq([...coauthors, uploaderAddress]);
      }
    }

    const proposalId = (!proposalByUuid.proposalId && proposal.status === "Discussion") ? await dolt.getNextProposalId() : proposalByUuid.proposalId;
    console.log('======================================================');
    console.log('=================== EDIT PROPOSAL ====================');
    console.log('======================================================');
    console.log(`space ${space}, author ${uploaderAddress}`);
    console.log(proposal);
    console.log('======================================================');
    console.log('======================================================');
    console.log('======================================================');

    // update governance cycle to current if proposal is a draft
    let { governanceCycle } = proposalByUuid;
    if (proposal.status === "Draft") {
      if (currentEvent.title === "Temperature Check" && allowCurrentCycleSubmission) {
        governanceCycle = currentCycle;
      }
      governanceCycle = currentCycle + 1;
    }

    const updateProposal: Proposal = {
      ...proposalByUuid,
      ...proposal,
      voteURL: snapshotId,
      proposalId,
      authorAddress,
      coauthors,
      governanceCycle,
    };

    const uuid = await dolt.editProposal(updateProposal, receipt);
    // return uuid to client, then continue doing things
    res.json({ success: true, data: { uuid } });

    clearCache(space);

    try {
      const discord = await discordLogin(config);
      // if proposal moved from Draft to Discussion, send discord message
      const shouldCreateDiscussion = (
        (proposalByUuid.status === "Draft")
        && proposal.status === "Discussion" && !proposalByUuid.discussionThreadURL
      );
      if (shouldCreateDiscussion) {
        try {
          const discussionThreadURL = await discord.startDiscussion(updateProposal);
          if (authorMeetsValidation || !proposalSubmissionValidation) await discord.setupPoll(getLastSlash(discussionThreadURL));
          await dolt.updateDiscussionURL({ ...updateProposal, discussionThreadURL });
        } catch (e) {
          console.error(`[DISCORD] ${e}`);
        }
      }

      // if proposal got sponsored by a valid author,
      // add Temperature Check embed and setup poll buttons
      if (proposalByUuid.status === "Discussion" && updateProposal.status === "Temperature Check") {
        await discord.editDiscussionMessage(updateProposal);
        await discord.setupPoll(getLastSlash(proposalByUuid.discussionThreadURL));
      }

      // archive alert
      if (proposal.status === "Archived") {
        try { await discord.sendProposalArchive(proposalByUuid); } catch (e) { console.error(`[DISCORD] ${e}`); }
      }
      // unarchive alert
      if (proposal.status === proposalSubmissionValidation?.metStatus && proposalByUuid.status === "Archived") {
        try { await discord.sendProposalUnarchive(proposalByUuid); } catch (e) { console.error(`[DISCORD] ${e}`); }
      }

      // send diff to discord
      const diff = diffLineCounts(proposalByUuid.body, proposal.body);
      const actionsChanged = !isEqual(proposalByUuid.actions, proposal.actions);
      if (
        proposalByUuid.discussionThreadURL &&
        (diff.added || diff.removed || actionsChanged)
      ) {
        updateProposal.discussionThreadURL = proposalByUuid.discussionThreadURL;
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
    const { dolt, config, spaceOwners, bearerAddress } = res.locals as Middleware;
    const deleterAddress = bearerAddress || envelope?.address;
    if (!deleterAddress) {
      res.json({ success: false, error: '[NANCE ERROR]: missing address for proposal delete' });
      return;
    }
    const proposalByUuid = await dolt.getProposalByAnyId(uuid);
    if (envelope && !bearerAddress) {
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

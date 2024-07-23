/* eslint-disable max-lines */
import express from 'express';
import {
  Proposal,
  ProposalUploadRequest,
  SpaceInfo,
  ProposalsPacket,
  ProposalUpdateRequest,
  ProposalDeleteRequest,
  ProposalQueryResponse,
} from '@nance/nance-sdk';
import { isEqual, uniq } from "lodash";
import logger from '../logging';
import { getLastSlash, uuidGen } from '../utils';
import { DoltHandler } from '../dolt/doltHandler';
import { diffLineCounts } from './helpers/diff';
import { canEditProposal, isMultisig, isNanceAddress, isNanceSpaceOwner } from './helpers/permissions';
import { addressFromJWT, addressFromSignature } from './helpers/auth';
import { DoltSysHandler } from '../dolt/doltSysHandler';
import { pools } from '../dolt/pools';
import { getSpaceInfo } from './helpers/getSpace';
import { fetchSnapshotProposal } from "../snapshot/snapshotProposals";
import { getSummary, postSummary } from "../nancearizer";
import { discordLogin } from "./helpers/discord";
import { headToUrl } from "../dolt/doltAPI";
import { dotPin } from "../storage/storageHandler";
import { formatSnapshotEnvelope, getSnapshotId } from "./helpers/snapshotUtils";
import { cache, clearCache } from "./helpers/cache";
import { getAddressVotingPower } from "../snapshot/snapshotVotingPower";

const router = express.Router();

const doltSys = new DoltSysHandler(pools.nance_sys);

async function handlerReq(_query: string, auth: string | undefined) {
  try {
    const query = _query.toLowerCase();
    if (!Object.keys(pools).includes(query)) {
      return await Promise.reject(new Error(`space ${query} not found`));
    }

    let spaceInfo = cache[query]?.spaceInfo;
    const now = new Date().toISOString();
    const currentEventEnd = spaceInfo?.currentEvent?.end;
    const refresh = currentEventEnd ? now > currentEventEnd : false;
    if (!spaceInfo || refresh) {
      console.log(`[CACHE] refreshing ${query}`);
      const spaceConfig = await doltSys.getSpaceConfig(query);
      spaceInfo = await getSpaceInfo(spaceConfig);
      cache[query] = { spaceInfo };
    }

    const dolt = new DoltHandler(pools[query], spaceInfo.config.proposalIdPrefix);
    const jwt = auth?.split('Bearer ')[1];
    const bearerAddress = (jwt && jwt !== 'null') ? await addressFromJWT(jwt) : null;

    // get nextProposalId
    let nextProposalId = cache[query]?.nextProposalId;
    if (!nextProposalId) {
      nextProposalId = await dolt.getNextProposalId();
      cache[query].nextProposalId = nextProposalId;
    }

    return {
      ...spaceInfo,
      bearerAddress,
      dolt,
      dolthubLink: headToUrl(spaceInfo.config.dolt.owner, spaceInfo.config.dolt.repo), // just send back repo link to reduce SQL calls
      nextProposalId,
    };
  } catch (e) {
    logger.error(e);
    return Promise.reject(e);
  }
}

// ================================ //
// ======== info functions ======== //
// ================================ //
router.get('/:space', async (req, res) => {
  console.time("space");
  const { space } = req.params;
  try {
    const { config, name, displayName, currentEvent, currentCycle, currentCycleDay, dolthubLink, spaceOwners, nextProposalId, cycleStartDate, nextEvents } = await handlerReq(space, req.headers.authorization);
    const spaceInfo: SpaceInfo = {
      name,
      displayName,
      currentCycle,
      currentCycleDay,
      currentEvent,
      nextEvents,
      spaceOwners,
      snapshotSpace: config.snapshot.space,
      juiceboxProjectId: config.juicebox.projectId,
      dolthubLink,
      nextProposalId,
      cycleStartDate,
    };
    if (config.juicebox.gnosisSafeAddress || config.juicebox.governorAddress) {
      spaceInfo.transactorAddress = {
        type: config.juicebox.gnosisSafeAddress ? 'safe' : 'governor',
        network: config.juicebox.network,
        address: config.juicebox.gnosisSafeAddress || config.juicebox.governorAddress,
      };
    }
    if (config.guildxyz) {
      spaceInfo.guildxyz = config.guildxyz;
    }
    return res.json({
      success: true,
      data: spaceInfo
    });
  } catch (e) {
    return res.send({ success: false, error: `[NANCE ERROR]: ${e}` });
  } finally {
    console.timeEnd("space");
  }
});

// ===================================== //
// ======== proposals functions ======== //
// ===================================== //

// query proposals
router.get('/:space/proposals', async (req, res) => {
  console.time("proposals");
  const { space } = req.params;
  try {
    const { cycle, keyword, author, limit, page } = req.query as { cycle: string, keyword: string, author: string, limit: string, page: string };
    const { dolt, config, currentCycle } = await handlerReq(space, req.headers.authorization);

    // calculate offset for SQL pagination
    const _limit = limit ? Number(limit) : 0;
    const _page = page ? Number(page) : 0;
    const _offset = _page ? (_page - 1) * _limit : 0;

    const cycleSearch = cycle || currentCycle.toString();

    // cache
    const key = `${space}:${JSON.stringify(req.query)}`;
    let data = cache[space]?.proposalsPacket?.[key];
    if (data) {
      return res.send({ success: true, data });
    }

    const { proposals, hasMore } = await dolt.getProposals({ governanceCycle: cycleSearch, keyword, author, limit: _limit, offset: _offset });

    data = {
      proposalInfo: {
        snapshotSpace: config?.snapshot.space || space,
        proposalIdPrefix: config.proposalIdPrefix,
        minTokenPassingAmount: config?.snapshot.minTokenPassingAmount || 0,
        nextProposalId: cache[space].nextProposalId || 0,
      },
      proposals,
      hasMore,
    };

    cache[space].proposalsPacket = { ...cache[space].proposalsPacket, [key]: data };

    return res.send({ success: true, data });
  } catch (e) {
    return res.send({ success: false, error: `[NANCE] ${e}` });
  } finally {
    console.timeEnd("proposals");
  }
});

// upload new proposal
router.post('/:space/proposals', async (req, res) => {
  const { space } = req.params;
  const { proposal, envelope } = req.body as ProposalUploadRequest;
  try {
    const { config, dolt, bearerAddress, currentCycle } = await handlerReq(space, req.headers.authorization);
    const uploaderAddress = bearerAddress || envelope?.address;
    if (!proposal) { res.json({ success: false, error: '[NANCE ERROR]: proposal object validation fail' }); return; }
    if (!uploaderAddress) { res.json({ success: false, error: '[NANCE ERROR]: missing address for proposal upload' }); return; }
    let receipt: string | undefined;
    let snapshotId: string | undefined;
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

    // check author snapshot voting power
    // if author doesn't meet the minimum balance, set author to undefined and add uploaderAddress to coauthors
    // then a valid author will need to resign the proposal to move it to Temperature Check
    let authorAddress: string | undefined = uploaderAddress;
    let authorMeetsValidation = false;
    let { coauthors } = proposal;
    const { status } = proposal;
    const { proposalSubmissionValidation } = config;
    if (proposalSubmissionValidation) {
      const { minBalance } = proposalSubmissionValidation;
      const balance = await getAddressVotingPower(uploaderAddress, config.snapshot.space);
      if (balance < minBalance) {
        authorAddress = undefined;
        coauthors = !coauthors ? [uploaderAddress] : uniq([...coauthors, uploaderAddress]);
        proposal.status = (status === "Discussion") ? proposalSubmissionValidation.notMetStatus : proposal.status;
      } else {
        authorMeetsValidation = true;
        proposal.status = (status === "Discussion") ? proposalSubmissionValidation.metStatus : proposal.status;
      }
    }

    const newProposal: Proposal = {
      ...proposal,
      uuid: proposal.uuid || uuidGen(),
      createdTime: proposal.createdTime || new Date().toISOString(),
      authorAddress,
      coauthors,
      voteURL: snapshotId,
    };

    if (!newProposal.governanceCycle) {
      newProposal.governanceCycle = currentCycle + 1;
    }
    if (newProposal.status === "Archived") newProposal.status = "Discussion"; // proposal forked from an archive, set to discussion
    if (config.submitAsApproved) newProposal.status = "Approved";

    console.log('======================================================');
    console.log('==================== NEW PROPOSAL ====================');
    console.log('======================================================');
    console.log(`space ${space}, author ${uploaderAddress}`);
    console.dir(newProposal, { depth: null });
    console.log('======================================================');
    console.log('======================================================');
    console.log('======================================================');
    dolt.addProposalToDb(newProposal, receipt).then(async (proposalRes) => {
      const { uuid } = proposalRes;
      proposal.uuid = uuid;

      // return uuid to client, then continue doing things
      res.json({ success: true, data: { uuid } });

      try {
        if (newProposal.status === "Discussion" || newProposal.status === "Temperature Check") {
          const discord = await discordLogin(config);
          try {
            const discussionThreadURL = await discord.startDiscussion(newProposal);
            if (authorMeetsValidation) await discord.setupPoll(getLastSlash(discussionThreadURL));
            await dolt.updateDiscussionURL({ ...newProposal, discussionThreadURL });
            discord.logout();
          } catch (e) {
            logger.error(`[DISCORD] ${e}`);
          }
        }

        if (space !== "waterbox") {
          const summary = await postSummary(newProposal, "proposal");
          dolt.updateSummary(uuid, summary, "proposal");
        }
        // update nextProposalId cache
        if (proposalRes.proposalId) {
          cache[space].nextProposalId = proposalRes.proposalId + 1;
        }

        // clear proposal cache
        cache[space].proposalsPacket = {};
      } catch (e) {
        logger.error(`[DISCORD] ${space}`);
        logger.error(`[DISCORD] ${e}`);
      }
    }).catch((e: any) => {
      res.json({ success: false, error: `[DATABASE ERROR]: ${e}` });
    });
  } catch (e: any) { res.json({ success: false, error: e.toString() }); }
});

// =========================================== //
// ======== single proposal functions ======== //
// =========================================== //

// get Snapshot proposal
router.get('/~/proposal/:pid', async (req, res) => {
  try {
    const proposal = await fetchSnapshotProposal(req.params.pid);
    res.json({ success: true, data: proposal });
  } catch (e) {
    res.json({ success: false, error: e });
  }
});

// get specific proposal by uuid, snapshotId, proposalId-#, or just proposalId #
router.get('/:space/proposal/:pid', async (req, res) => {
  console.time("proposal");
  const { space, pid } = req.params;
  let proposal: Proposal | undefined;
  try {
    const { dolt, config, nextProposalId } = await handlerReq(space, req.headers.authorization);
    const proposalInfo = {
      proposalIdPrefix: config.proposalIdPrefix,
      minTokenPassingAmount: config.snapshot.minTokenPassingAmount,
      snapshotSpace: config.snapshot.space,
      nextProposalId
    };

    if (cache[space].proposalsPacket) {
      const packets = Object.values(cache[space].proposalsPacket as Record<string, ProposalsPacket>);
      const proposals = packets.map((p) => p.proposals).flat();
      proposal = proposals.find((p) => p.uuid === pid || p.voteURL === pid || p?.proposalId === Number(pid));
      if (proposal) {
        res.json({ success: true, data: { ...proposal, proposalInfo } });
        return;
      }
    }
    proposal = await dolt.getProposalByAnyId(pid);
    if (!proposal) { throw Error(); }
    res.json({ success: true, data: { ...proposal, proposalInfo }
    } as ProposalQueryResponse);
  } catch (e) {
    res.send({ success: false, error: '[NANCE ERROR]: proposal not found' });
  } finally {
    console.timeEnd("proposal");
  }
});

// edit single proposal
router.put('/:space/proposal/:pid', async (req, res) => {
  const { space, pid } = req.params;
  try {
    const { proposal, envelope } = req.body as ProposalUpdateRequest;
    const { dolt, config, bearerAddress, spaceOwners, currentCycle } = await handlerReq(space, req.headers.authorization);

    const proposalByUuid = await dolt.getProposalByAnyId(pid);
    console.log(proposalByUuid);
    if (!canEditProposal(proposalByUuid.status)) {
      res.json({ success: false, error: '[NANCE ERROR]: proposal edits no longer allowed' });
      return;
    }

    const uploaderAddress = bearerAddress || envelope?.address;
    if (!uploaderAddress) { res.json({ success: false, error: '[NANCE ERROR]: missing address for proposal upload' }); return; }
    let receipt: string | undefined;
    let snapshotId: string | undefined;
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
      || isNanceAddress(uploaderAddress)
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
    const { proposalSubmissionValidation } = config;
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

    // clear proposal cache
    cache[space].proposalsPacket = {};

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
          if (authorMeetsValidation) await discord.setupPoll(getLastSlash(discussionThreadURL));
          await dolt.updateDiscussionURL({ ...updateProposal, discussionThreadURL });
        } catch (e) {
          logger.error(`[DISCORD] ${e}`);
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
        try { await discord.sendProposalArchive(proposalByUuid); } catch (e) { logger.error(`[DISCORD] ${e}`); }
      }
      // unarchive alert
      if (proposal.status === proposalSubmissionValidation?.metStatus && proposalByUuid.status === "Archived") {
        try { await discord.sendProposalUnarchive(proposalByUuid); } catch (e) { logger.error(`[DISCORD] ${e}`); }
      }

      // send diff to discord
      const diff = diffLineCounts(proposalByUuid.body, proposal.body);
      const actionsChanged = !isEqual(proposalByUuid.actions, proposal.actions);
      if (
        proposalByUuid.discussionThreadURL
        && (diff.added || diff.removed || actionsChanged)
      ) {
        updateProposal.discussionThreadURL = proposalByUuid.discussionThreadURL;
        await discord.editDiscussionMessage(updateProposal);
        if (diff.added || diff.removed) await discord.sendProposalDiff(updateProposal, diff);
      }
      discord.logout();
    } catch (e) {
      logger.error(`[DISCORD] ${space}`);
      logger.error(`[DISCORD] ${e}`);
    }
  } catch (e: any) {
    res.json({ success: false, error: e.toString() });
  }
});

// delete single proposal
router.delete('/:space/proposal/:uuid', async (req, res) => {
  try {
    const { space, uuid } = req.params;
    const { envelope } = req.body as ProposalDeleteRequest;
    const { dolt, config, spaceOwners, bearerAddress } = await handlerReq(space, req.headers.authorization);
    const deleterAddress = bearerAddress || envelope?.address;
    if (!deleterAddress) { res.json({ success: false, error: '[NANCE ERROR]: missing address for proposal delete' }); return; }
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
      logger.info(`DELETE issued by ${deleterAddress}`);
      dolt.deleteProposal(uuid).then(async (affectedRows: number) => {
        res.json({ success: true, data: { affectedRows } });
        // clear proposal cache
        cache[space].proposalsPacket = {};
        try {
          const discord = await discordLogin(config);
          await discord.sendProposalDelete(proposalByUuid);
          discord.logout();
        } catch (e) { logger.error(`[DISCORD] ${e}`); }
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

// fetch summary and save to db
router.get('/:space/summary/:type/:pid', async (req, res) => {
  try {
    const { space, pid, type } = req.params;
    const { dolt } = await handlerReq(space, req.headers.authorization);
    if (type !== "proposal" && type !== "thread") { res.json({ success: false, error: "invalid summary type" }); return; }

    const summary = await getSummary(space, pid, type);
    const proposal = await dolt.getProposalByAnyId(pid);
    await dolt.updateSummary(proposal.uuid, summary, type);

    // clear proposal cache
    cache[space].proposalsPacket = {};

    res.json({ success: true, data: summary });
  } catch (e: any) {
    res.json({ success: false, error: e.toString() });
  }
});

// ===================================== //
// ======== admin-ish functions ======== //
// ===================================== //

// create discussion and poll (used if it failed to automatically create)
router.get('/:space/discussion/:uuid', async (req, res) => {
  const { space, uuid } = req.params;
  const { config, dolt } = await handlerReq(space, req.headers.authorization);
  const proposal = await dolt.getProposalByAnyId(uuid);
  let discussionThreadURL = '';
  if (proposal.status === "Discussion" && !proposal.discussionThreadURL) {
    const discord = await discordLogin(config);
    try {
      discussionThreadURL = await discord.startDiscussion(proposal);
      await discord.setupPoll(getLastSlash(discussionThreadURL));
      await dolt.updateDiscussionURL({ ...proposal, discussionThreadURL });
    } catch (e) {
      logger.error(`[DISCORD] ${e}`);
    }
    res.json({ success: true, data: discussionThreadURL });
    discord.logout();
    return;
  }
  res.send({ success: false, error: 'proposal already has a discussion created' });
});

router.get('/:space/cache/clear', async (req, res) => {
  const { space } = req.params;
  clearCache(space);
  res.json({ success: true });
});

export default router;

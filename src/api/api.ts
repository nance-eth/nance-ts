/* eslint-disable max-lines */
import express from 'express';
import {
  Proposal,
  ProposalUploadRequest,
  SpaceInfo,
  ProposalsPacket,
  SQLPayout,
  SQLTransfer,
  ProposalUpdateRequest,
  SpaceConfig,
  ProposalDeleteRequest
} from '@nance/nance-sdk';
import logger from '../logging';
import { GnosisHandler } from '../gnosis/gnosisHandler';
import { getLastSlash, sleep, uuidGen } from '../utils';
import { DoltHandler } from '../dolt/doltHandler';
import { DiscordHandler } from '../discord/discordHandler';
import { diffLineCounts } from './helpers/diff';
import { canEditProposal, isMultisig, isNanceAddress, isNanceSpaceOwner } from './helpers/permissions';
import { encodeCustomTransaction, encodeGnosisMulticall } from '../transactions/transactionHandler';
import { TenderlyHandler } from '../tenderly/tenderlyHandler';
import { addressFromJWT, addressFromSignature, addressHasGuildRole } from './helpers/auth';
import { DoltSysHandler } from '../dolt/doltSysHandler';
import { pools } from '../dolt/pools';
import { getSpaceInfo } from './helpers/getSpace';
import { fetchSnapshotProposal } from "../snapshot/snapshotProposals";
import { getSummary, postSummary } from "../nancearizer";
import { discordLogin } from "./helpers/discord";
import { headToUrl } from "../dolt/doltAPI";

const router = express.Router();

const doltSys = new DoltSysHandler(pools.nance_sys);

const spaceCache = {} as { [key: string]: { spaceConfig: SpaceConfig, nextProposalId: number } };

async function handlerReq(_query: string, auth: string | undefined) {
  try {
    const query = _query.toLowerCase();
    if (!Object.keys(pools).includes(query)) {
      return await Promise.reject(new Error(`space ${query} not found`));
    }

    // cache spaceConfig to reduce SQL calls
    let spaceConfig = spaceCache[query]?.spaceConfig;
    if (!spaceConfig) {
      spaceConfig = await doltSys.getSpaceConfig(query);
      spaceCache[query] = { spaceConfig, nextProposalId: 0 };
    }
    const spaceInfo = await getSpaceInfo(spaceConfig);
    const dolt = new DoltHandler(pools[query], spaceInfo.config.proposalIdPrefix);
    const jwt = auth?.split('Bearer ')[1];
    const bearerAddress = (jwt && jwt !== 'null') ? await addressFromJWT(jwt) : null;

    // get nextProposalId
    let nextProposalId = spaceCache[query]?.nextProposalId;
    if (!nextProposalId) {
      nextProposalId = await dolt.getNextProposalId();
      spaceCache[query].nextProposalId = nextProposalId;
    }

    return {
      name: query,
      displayName: spaceInfo.displayName,
      spaceOwners: spaceInfo.spaceOwners,
      bearerAddress,
      config: spaceInfo.config,
      currentGovernanceCycle: spaceInfo.currentCycle,
      cycleStartDate: spaceInfo.cycleStartDate,
      currentEvent: spaceInfo.currentEvent,
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
    const { config, name, displayName, currentEvent, currentGovernanceCycle, dolthubLink, spaceOwners, nextProposalId, cycleStartDate } = await handlerReq(space, req.headers.authorization);
    const spaceInfo: SpaceInfo = {
      name,
      displayName,
      currentCycle: currentGovernanceCycle,
      currentEvent,
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
    const { dolt, config, currentGovernanceCycle } = await handlerReq(space, req.headers.authorization);

    // calculate offset for SQL pagination
    const _limit = limit ? Number(limit) : 0;
    const _page = page ? Number(page) : 0;
    const _offset = _page ? (_page - 1) * _limit : 0;

    const cycleSearch = cycle || currentGovernanceCycle.toString();
    const { proposals, hasMore } = await dolt.getProposals({ governanceCycle: cycleSearch, keyword, author, limit: _limit, offset: _offset });

    const data: ProposalsPacket = {
      proposalInfo: {
        snapshotSpace: config?.snapshot.space || space,
        proposalIdPrefix: config.proposalIdPrefix,
        minTokenPassingAmount: config?.snapshot.minTokenPassingAmount || 0,
      },
      proposals,
      hasMore,
    };

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
  const { proposal, uploaderAddress, uploaderSignature } = req.body as ProposalUploadRequest;
  try {
    const { config, dolt, bearerAddress, currentGovernanceCycle } = await handlerReq(space, req.headers.authorization);
    const address = bearerAddress || uploaderAddress;
    if (!proposal) { res.json({ success: false, error: '[NANCE ERROR]: proposal object validation fail' }); return; }
    if (!address) { res.json({ success: false, error: '[NANCE ERROR]: missing address for proposal upload' }); return; }
    if (uploaderAddress && uploaderSignature) {
      const decodedAddress = await addressFromSignature(proposal, uploaderSignature, "Proposal");
      if (uploaderAddress !== decodedAddress) {
        res.json({ success: false, error: '[NANCE ERROR]: uploaderAddress and uploaderSignature do not match' });
        return;
      }
    }

    // check Guildxyz access, allow draft uploads regardless of Guildxyz access
    if (config.guildxyz && proposal.status === "Discussion") {
      const access = await addressHasGuildRole(address, config.guildxyz.id, config.guildxyz.roles);
      console.log(`[PERMISSIONS] ${address} has access: ${access}`);
      if (!access) {
        res.json({
          success: false,
          error: `[PERMISSIONS] User doesn't have role ${config.guildxyz.roles} for ${config.guildxyz.id}` });
        return;
      }
    }
    const newProposal: Proposal = {
      ...proposal,
      uuid: proposal.uuid || uuidGen(),
      createdTime: new Date().toISOString(),
      authorAddress: address,
      discussionThreadURL: ""
    };
    if (!newProposal.governanceCycle) {
      newProposal.governanceCycle = currentGovernanceCycle + 1;
    }
    if (!newProposal.authorAddress) { newProposal.authorAddress = address || uploaderAddress; }
    if (newProposal.status === "Archived") { newProposal.status = "Discussion"; } // proposal forked from an archive, set to discussion
    if (config.submitAsApproved) { newProposal.status = "Approved"; }
    console.log('======================================================');
    console.log('==================== NEW PROPOSAL ====================');
    console.log('======================================================');
    console.log(`space ${space}, author ${address}`);
    console.dir(newProposal, { depth: null });
    console.log('======================================================');
    console.log('======================================================');
    console.log('======================================================');
    dolt.addProposalToDb(newProposal).then(async (uuid: string) => {
      proposal.uuid = uuid;
      dolt.actionDirector(newProposal);

      // send discord message
      const discordEnabled = config.discord.channelIds.proposals !== null;
      if ((proposal.status === "Discussion" || proposal.status === "Approved") && discordEnabled) {
        const dialogHandler = new DiscordHandler(config);
        // eslint-disable-next-line no-await-in-loop
        while (!dialogHandler.ready()) { await sleep(50); }
        try {
          const discussionThreadURL = await dialogHandler.startDiscussion(newProposal);
          dialogHandler.setupPoll(getLastSlash(discussionThreadURL));
          dolt.updateDiscussionURL({ ...newProposal, discussionThreadURL });
        } catch (e) {
          logger.error(`[DISCORD] ${e}`);
        }
      }
      res.json({ success: true, data: { uuid } });
      const summary = await postSummary(newProposal, "proposal");
      dolt.updateSummary(uuid, summary, "proposal");
      // update nextProposalId
      spaceCache[space].nextProposalId += 1;
    }).catch((e: any) => {
      res.json({ success: false, error: `[DATABASE ERROR]: ${e}` });
    });
  } catch (e) { res.json({ success: false, error: `[NANCE ERROR]: ${e}` }); }
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
    proposal = await dolt.getProposalByAnyId(pid);
    const proposalId = proposal.proposalId ? `${config.proposalIdPrefix}${proposal.proposalId}` : undefined;
    res.send({
      success: true,
      data: {
        ...proposal,
        proposalId,
        minTokenPassingAmount: config.snapshot.minTokenPassingAmount,
        snapshotSpace: config.snapshot.space,
        nextProposalId
      }
    });
  } catch (e) {
    res.send({ success: false, error: '[NANCE ERROR]: proposal not found' });
  } finally {
    console.timeEnd("proposal");
  }
});

// edit single proposal
router.put('/:space/proposal/:pid', async (req, res) => {
  const { space, pid } = req.params;
  const { proposal, uploaderSignature, uploaderAddress } = req.body as ProposalUpdateRequest;
  const { dolt, config, bearerAddress, spaceOwners, currentGovernanceCycle } = await handlerReq(space, req.headers.authorization);
  const address = bearerAddress || uploaderAddress;
  if (!address) { res.json({ success: false, error: '[NANCE ERROR]: missing address for proposal upload' }); return; }
  if (uploaderAddress && uploaderSignature) {
    const decodedAddress = await addressFromSignature(proposal, uploaderSignature, "Proposal");
    if (uploaderAddress !== decodedAddress) {
      res.json({ success: false, error: '[NANCE ERROR]: uploaderAddress and uploaderSignature do not match' });
      return;
    }
  }
  const proposalByUuid = await dolt.getProposalByAnyId(pid);
  if (!canEditProposal(proposalByUuid.status)) {
    res.json({ success: false, error: '[NANCE ERROR]: proposal edits no longer allowed' });
    return;
  }

  // only allow archives by original author, multisig, or spaceOwner
  const permissions = (
    address === proposalByUuid.authorAddress
    || await isMultisig(config.juicebox.gnosisSafeAddress, address)
    || isNanceSpaceOwner(spaceOwners, address)
    || isNanceAddress(address)
  );
  if (proposal.status === "Archived" && !permissions) {
    res.json({ success: false, error: '[PERMISSIONS] User not authorized to archive proposal' });
    return;
  }

  // eslint-disable-next-line prefer-const
  let { authorAddress, coauthors, governanceCycle } = proposalByUuid;
  if (address && !proposalByUuid.coauthors?.includes(address) && address !== proposalByUuid.authorAddress) {
    coauthors?.push(address);
  }
  const proposalId = (!proposalByUuid.proposalId && proposal.status === "Discussion") ? await dolt.getNextProposalId() : proposalByUuid.proposalId;
  console.log('======================================================');
  console.log('=================== EDIT PROPOSAL ====================');
  console.log('======================================================');
  console.log(`space ${space}, author ${address}`);
  console.log(proposal);
  console.log('======================================================');
  console.log('======================================================');
  console.log('======================================================');

  // update governance cycle to current if proposal is a draft
  if (proposal.status === "Draft") {
    governanceCycle = currentGovernanceCycle + 1;
  }

  const updateProposal: Proposal = {
    ...proposalByUuid,
    ...proposal,
    proposalId,
    authorAddress,
    coauthors,
    governanceCycle,
  };

  const discord = await discordLogin(config);
  dolt.editProposal(updateProposal).then(async (uuid: string) => {
    // if proposal moved form Draft to Discussion, send discord message
    const shouldCreateDiscussion = (
      (proposalByUuid.status === "Draft")
      && proposal.status === "Discussion" && !proposalByUuid.discussionThreadURL
    );
    if (shouldCreateDiscussion) {
      try {
        const discussionThreadURL = await discord.startDiscussion(updateProposal);
        await discord.setupPoll(getLastSlash(discussionThreadURL));
        await dolt.updateDiscussionURL({ ...updateProposal, discussionThreadURL });
      } catch (e) {
        logger.error(`[DISCORD] ${e}`);
      }
    }
    // archive alert
    if (proposal.status === "Archived") {
      try { await discord.sendProposalArchive(proposalByUuid); } catch (e) { logger.error(`[DISCORD] ${e}`); }
    }
    // unarchive alert
    if (proposal.status === "Discussion" && proposalByUuid.status === "Archived") {
      try { await discord.sendProposalUnarchive(proposalByUuid); } catch (e) { logger.error(`[DISCORD] ${e}`); }
    }

    // send diff to discord
    const diff = diffLineCounts(proposalByUuid.body || '', proposal.body || '');
    if (proposalByUuid.discussionThreadURL && diff) {
      updateProposal.discussionThreadURL = proposalByUuid.discussionThreadURL;
      await discord.editDiscussionTitle(updateProposal);
      await discord.sendProposalDiff(updateProposal, diff);
    }
    discord.logout();
    res.json({ success: true, data: { uuid } });
  }).catch((e: any) => {
    res.json({ success: false, error: JSON.stringify(e) });
  });
});

// delete single proposal
router.delete('/:space/proposal/:uuid', async (req, res) => {
  const { space, uuid } = req.params;
  const { deleterAddress, deleterSignature } = req.body as ProposalDeleteRequest;
  const { dolt, config, spaceOwners, bearerAddress } = await handlerReq(space, req.headers.authorization);
  const address = bearerAddress || deleterAddress;
  if (!address) { res.json({ success: false, error: '[NANCE ERROR]: missing address for proposal delete' }); return; }
  const proposalByUuid = await dolt.getProposalByAnyId(uuid);
  if (deleterAddress && deleterSignature) {
    const decodedAddress = await addressFromSignature(proposalByUuid, deleterSignature, "DeleteProposal");
    if (deleterAddress !== decodedAddress) {
      res.json({ success: false, error: '[NANCE ERROR]: uploaderAddress and uploaderSignature do not match' });
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
    address === proposalByUuid.authorAddress
    || await isMultisig(config.juicebox.gnosisSafeAddress, address)
    || isNanceSpaceOwner(spaceOwners, address)
    || isNanceAddress(address)
  );

  if (permissions) {
    logger.info(`DELETE issued by ${address}`);
    dolt.deleteProposal(uuid).then(async (affectedRows: number) => {
      const discord = new DiscordHandler(config);
      // eslint-disable-next-line no-await-in-loop
      while (!discord.ready()) { await sleep(50); }
      try { await discord.sendProposalDelete(proposalByUuid); } catch (e) { logger.error(`[DISCORD] ${e}`); }
      res.json({ success: true, data: { affectedRows } });
    }).catch((e: any) => {
      res.json({ success: false, error: e });
    });
  } else {
    res.json({ success: false, error: '[PERMISSIONS] User not authorized to delete proposal' });
  }
});

// fetch summary and save to db
router.get('/:space/summary/:type/:pid', async (req, res) => {
  const { space, pid, type } = req.params;
  const { dolt } = await handlerReq(space, req.headers.authorization);
  if (type !== "proposal" && type !== "thread") { res.json({ success: false, error: "invalid summary type" }); return; }

  const summary = await getSummary(space, pid, type);
  const proposal = await dolt.getProposalByAnyId(pid);
  await dolt.updateSummary(proposal.uuid, summary, type);
  res.json({ success: true, data: summary });
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
    const dialogHandler = new DiscordHandler(config);
    // eslint-disable-next-line no-await-in-loop
    while (!dialogHandler.ready()) { await sleep(50); }
    try {
      discussionThreadURL = await dialogHandler.startDiscussion(proposal);
      await dialogHandler.setupPoll(getLastSlash(discussionThreadURL));
      await dolt.updateDiscussionURL({ ...proposal, discussionThreadURL });
    } catch (e) {
      logger.error(`[DISCORD] ${e}`);
    }
    return res.json({ success: true, data: discussionThreadURL });
  }
  return res.send({ success: false, error: 'proposal already has a discussion created' });
});

// ===================================== //
// ========= payout functions ========== //
// ===================================== //

// get payouts table
router.get('/:space/payouts', async (req, res) => {
  const { space } = req.params;
  try {
    const { cycle } = req.query as { cycle: string };
    const { dolt, currentGovernanceCycle } = await handlerReq(space, req.headers.authorization);

    if (!cycle) {
      dolt.getPayoutsDb(currentGovernanceCycle).then((data: SQLPayout[]) => {
        res.json({ success: true, data });
      }).catch((e: any) => {
        res.json({ success: false, error: e });
      });
    } else {
      dolt.getPreviousPayoutsDb('V3', Number(cycle)).then((data: SQLPayout[]) => {
        res.json({ success: true, data });
      }).catch((e: any) => {
        res.json({ success: false, error: e });
      });
    }
  } catch (e) {
    res.json({ success: false, error: e });
  }
});

// ===================================== //
// ======== transfer functions ========= //
// ===================================== //

// get transfers table
router.get('/:space/transfers', async (req, res) => {
  const { space } = req.params;
  const { dolt, currentGovernanceCycle } = await handlerReq(space, req.headers.authorization);
  dolt.getTransfersDb(currentGovernanceCycle).then((data: SQLTransfer[]) => {
    res.json({ success: true, data });
  }).catch((e: any) => {
    res.json({ success: false, error: e });
  });
});

// basic simulation of a single customTransaction sent from the space gnosis safe
router.get('/:space/simulate/:uuid', async (req, res) => {
  try {
    const { space, uuid } = req.params;
    const { dolt, config } = await handlerReq(space, req.headers.authorization);
    const txn = await dolt.getTransactionsByUuids([uuid]);
    if (!txn || txn.length === 0) { res.json({ success: false, error: 'no transaction found' }); return; }
    const tenderly = new TenderlyHandler({ account: 'jigglyjams', project: 'nance' });
    const encodedTransaction = await encodeCustomTransaction(txn[0]);
    const from = config.juicebox.gnosisSafeAddress || config.juicebox.governorAddress;
    const tenderlyResults = await tenderly.simulate(encodedTransaction.bytes, encodedTransaction.address, from);
    res.json({ success: true, data: { ...tenderlyResults } });
  } catch (e) {
    res.json({ success: false, error: e });
  }
});

// tenderly simulation of multiple transactions, encoded using gnosis MultiCall
// pass in comma separated uuids of transactions to simulate as a query ex: ?uuids=uuid1,uuid2,uuid3...
router.get('/:space/simulateMulticall', async (req, res) => {
  try {
    const { space } = req.params;
    const { uuids, uuidOfProposal } = req.query as { uuids: string, uuidOfProposal: string };
    const { dolt, config } = await handlerReq(space, req.headers.authorization);
    const txn = (uuidOfProposal) ? await dolt.getTransactionsByProposalUuid(uuidOfProposal) : await dolt.getTransactionsByUuids(uuids.split(','));
    if (!txn || txn.length === 0) { res.json({ success: false, error: 'no transaction found' }); return; }
    const signer = (await GnosisHandler.getSigners(config.juicebox.gnosisSafeAddress))[0]; // get the first signer to encode MultiCall
    const encodedTransactions = await encodeGnosisMulticall(txn, signer);
    const tenderly = new TenderlyHandler({ account: 'jigglyjams', project: 'nance' });
    const tenderlyResults = await tenderly.simulate(encodedTransactions.data, config.juicebox.gnosisSafeAddress, signer, true);
    res.json({ success: true, data: { ...tenderlyResults, transactionCount: encodedTransactions.count, transactions: encodedTransactions.transactions } });
  } catch (e) {
    res.json({ success: false, error: e });
  }
});

export default router;

import express from 'express';
import { Nance } from '../nance';
import { NotionHandler } from '../notion/notionHandler';
import { NanceTreasury } from '../treasury';
import { doltConfig } from '../configLoader';
import logger from '../logging';
import { ProposalUploadRequest, FetchReconfigureRequest, EditPayoutsRequest, ProposalsPacket } from './models';
import { GnosisHandler } from '../gnosis/gnosisHandler';
import { getENS } from './helpers/ens';
import { getLastSlash, myProvider, sleep } from '../utils';
import { CalendarHandler } from '../calendar/CalendarHandler';
import { DoltHandler } from '../dolt/doltHandler';
import { DiscordHandler } from '../discord/discordHandler';
import { dbOptions } from '../dolt/dbConfig';
import { SQLPayout, SQLTransfer } from '../dolt/schema';
import { NanceConfig, Proposal } from '../types';
import { diffBody } from './helpers/diff';
import { isMultisig, isNanceAddress, isNanceSpaceOwner } from './helpers/permissions';
import { headToUrl } from '../dolt/doltAPI';
import { encodeGnosisMulticall } from '../transactions/transactionHandler';
import { TenderlyHandler } from '../tenderly/tenderlyHandler';
import { addressFromJWT } from './helpers/auth';

const router = express.Router();
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

async function handlerReq(query: string, auth: string | undefined) {
  const { config, calendarText, spaceOwners } = await doltConfig(query);
  const dolt = new DoltHandler(dbOptions(config.dolt.repo), config.propertyKeys);
  const calendar = new CalendarHandler(calendarText);
  const jwt = auth?.split('Bearer ')[1];
  let address = null;
  try {
    address = (jwt && jwt !== 'null') ? await addressFromJWT(jwt) : null;
  } catch (e) {
    logger.error(e);
  }
  return { spaceOwners, address, config, calendar, dolt };
}

// ================================ //
// ======== info functions ======== //
// ================================ //
router.get('/:space', async (req, res) => {
  const { space } = req.params;
  try {
    const { dolt, calendar, config } = await handlerReq(space, req.headers.authorization);
    const currentEvent = calendar.getCurrentEvent();
    const currentCycle = await dolt.getCurrentGovernanceCycle();
    const head = await dolt.getHead();
    dolt.localDolt.closeConnection();
    return res.send({
      sucess: true,
      data: {
        name: space,
        currentCycle,
        currentEvent,
        snapshotSpace: config.snapshot.space,
        juiceboxProjectId: config.juicebox.projectId,
        dolthubLink: headToUrl(config.dolt.owner, config.dolt.repo, head),
      }
    });
  } catch (e) {
    return res.send({ success: false, error: `[NANCE ERROR]: ${e}` });
  }
});

// ===================================== //
// ======== proposals functions ======== //
// ===================================== //

// query proposals
router.get('/:space/proposals', async (req, res) => {
  const { space } = req.params;
  const { cycle, keyword, author, limit, page } = req.query as { cycle: string, keyword: string, author: string, limit: string, page: string };
  const { dolt, config } = await handlerReq(space, req.headers.authorization);
  const data: ProposalsPacket = { proposalInfo: { proposalIdPrefix: config.propertyKeys.proposalIdPrefix, minTokenPassingAmount: config.snapshot.minTokenPassingAmount }, proposals: [] };

  try {
    // calculate offset for SQL pagination
    const _limit = limit ? Number(limit) : 0;
    const _page = page ? Number(page) : 0;
    const _offset = _page ? (_page - 1) * _limit : 0;

    if (!keyword && !cycle) {
      const cycleSearch = cycle || (await dolt.getCurrentGovernanceCycle()).toString();
      data.proposals = await dolt.getProposalsByGovernanceCycle(cycleSearch, _limit, _offset);
    }
    if (!keyword && cycle) { data.proposals = await dolt.getProposalsByGovernanceCycle(cycle, _limit, _offset); }
    if (keyword && !cycle) { data.proposals = await dolt.getProposalsByKeyword(keyword, _limit, _offset); }
    if (keyword && cycle) { data.proposals = await dolt.getProposalsByGovernanceCycleAndKeyword(cycle, keyword, _limit, _offset); }
    if (author) { data.proposals = await dolt.getProposalsByAuthorAddress(author); }
    dolt.localDolt.closeConnection();
    return res.send({ success: true, data });
  } catch (e) {
    dolt.localDolt.closeConnection();
    return res.send({ success: false, error: `[NANCE] ${e}` });
  }
});

// upload new proposal
router.post('/:space/proposals', async (req, res) => {
  const { space } = req.params;
  const { proposal } = req.body as ProposalUploadRequest;
  const { config, calendar, dolt, address } = await handlerReq(space, req.headers.authorization);
  if (!proposal) { res.json({ success: false, error: '[NANCE ERROR]: proposal object validation fail' }); return; }
  if (!address) { res.json({ success: false, error: '[NANCE ERROR]: missing SIWE adddress for proposal upload' }); return; }
  logger.debug(`[UPLOAD] space: ${space}, address: ${address} good`);
  if (!proposal.governanceCycle) {
    const currentGovernanceCycle = await dolt.getCurrentGovernanceCycle();
    proposal.governanceCycle = currentGovernanceCycle + 1;
  }
  if (!proposal.authorAddress) { proposal.authorAddress = address; }
  if (proposal.status === 'Private') {
    dolt.addPrivateProposalToDb(proposal).then(async (hash: string) => {
      dolt.localDolt.closeConnection();
      res.json({ success: true, data: { hash } });
    });
  } else {
    dolt.addProposalToDb(proposal).then(async (hash: string) => {
      proposal.hash = hash;
      dolt.actionDirector(proposal);

      // send discord message
      if (proposal.status === 'Discussion' && calendar.shouldSendDiscussion()) {
        const dialogHandler = new DiscordHandler(config);
        // eslint-disable-next-line no-await-in-loop
        while (!dialogHandler.ready()) { await sleep(50); }
        try {
          const discussionThreadURL = await dialogHandler.startDiscussion(proposal);
          dialogHandler.setupPoll(getLastSlash(discussionThreadURL));
          dolt.updateDiscussionURL({ ...proposal, discussionThreadURL });
        } catch (e) {
          logger.error(`[DISCORD] ${e}`);
        }
      }
      dolt.localDolt.closeConnection();
      res.json({ success: true, data: { hash } });
    }).catch((e: any) => {
      dolt.localDolt.closeConnection();
      res.json({ success: false, error: `[DATABASE ERROR]: ${e}` });
    });
  }
});

// =========================================== //
// ======== single proposal functions ======== //
// =========================================== //

// get specific proposal by uuid, snapshotId, proposalId-#, or just proposalId #
router.get('/:space/proposal/:pid', async (req, res) => {
  const { space, pid } = req.params;
  const { dolt } = await handlerReq(space, req.headers.authorization);
  return res.send(
    await dolt.getProposalByAnyId(pid).then((proposal: Proposal) => {
      dolt.localDolt.closeConnection();
      return { sucess: true, data: proposal };
    }).catch((e: any) => {
      dolt.localDolt.closeConnection();
      return { success: false, error: e };
    })
  );
});

// edit single proposal
router.put('/:space/proposal/:pid', async (req, res) => {
  const { space, pid } = req.params;
  const { proposal } = req.body as ProposalUploadRequest;
  const { dolt, config, address } = await handlerReq(space, req.headers.authorization);
  if (!address) { res.json({ success: false, error: '[NANCE ERROR]: missing SIWE adddress for proposal upload' }); return; }
  const proposalByUuid = await dolt.getProposalByAnyId(pid);
  if (proposalByUuid.status !== 'Discussion' && proposalByUuid.status !== 'Draft' && proposalByUuid.status !== 'Temperature Check') {
    dolt.localDolt.closeConnection();
    res.json({ success: false, error: '[NANCE ERROR]: proposal edits no longer allowed' });
    return;
  }
  proposal.coauthors = proposalByUuid.coauthors ?? [];
  if (address && !proposalByUuid.coauthors?.includes(address) && address !== proposalByUuid.authorAddress) {
    proposal.coauthors.push(address);
  }
  proposal.proposalId = (!proposalByUuid.proposalId && proposal.status === 'Discussion') ? await dolt.getNextProposalId() : proposalByUuid.proposalId;
  logger.info(`EDIT issued by ${address} for uuid: ${proposal.hash}`);
  dolt.editProposal(proposal).then(async (hash: string) => {
    const diff = diffBody(proposalByUuid.body || '', proposal.body || '');
    dolt.actionDirector(proposal);
    // if proposal moved form Draft to Discussion, send discord message
    if (proposalByUuid.status === 'Draft' && proposal.status === 'Discussion') {
      const discord = new DiscordHandler(config);
      // eslint-disable-next-line no-await-in-loop
      while (!discord.ready()) { await sleep(50); }
      try {
        const discussionThreadURL = await discord.startDiscussion(proposal);
        await discord.setupPoll(getLastSlash(discussionThreadURL));
        await dolt.updateDiscussionURL({ ...proposal, discussionThreadURL });
        discord.logout();
      } catch (e) {
        logger.error(`[DISCORD] ${e}`);
      }
    }
    // send diff to discord
    if (proposalByUuid.discussionThreadURL && diff) {
      const discord = new DiscordHandler(config);
      // eslint-disable-next-line no-await-in-loop
      while (!discord.ready()) { await sleep(50); }
      proposal.discussionThreadURL = proposalByUuid.discussionThreadURL;
      await discord.editDiscussionTitle(proposal);
      await discord.sendProposalDiff(getLastSlash(proposalByUuid.discussionThreadURL), diff, pid);
      discord.logout();
    }
    dolt.localDolt.closeConnection();
    res.json({ success: true, data: { hash } });
  }).catch((e: any) => {
    dolt.localDolt.closeConnection();
    res.json({ success: false, error: JSON.stringify(e) });
  });
});

// delete single proposal
router.delete('/:space/proposal/:hash', async (req, res) => {
  const { space, hash } = req.params;
  const { dolt, config, spaceOwners, address } = await handlerReq(space, req.headers.authorization);
  if (!address) { res.json({ success: false, error: '[NANCE ERROR]: missing SIWE adddress for proposal upload' }); return; }
  dolt.getProposalByAnyId(hash).then(async (proposalByUuid: Proposal) => {
    if (proposalByUuid.status !== 'Discussion' && proposalByUuid.status !== 'Draft') {
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
      dolt.deleteProposal(hash).then(async (affectedRows: number) => {
        dolt.localDolt.closeConnection();
        res.json({ success: true, data: { affectedRows } });
      }).catch((e: any) => {
        dolt.localDolt.closeConnection();
        res.json({ success: false, error: e });
      });
    } else {
      dolt.localDolt.closeConnection();
      res.json({ success: false, error: '[PERMISSIONS] User not authorized to  proposal' });
    }
  }).catch((e) => {
    console.log(e);
    dolt.localDolt.closeConnection();
    res.json({ success: false, error: 'proposal not found' });
  });
});

// ==================================== //
// ======== multisig functions ======== //
// ==================================== //

router.get('/:space/reconfigure', async (req, res) => {
  const { space } = req.params;
  const { version = 'V3', address = ZERO_ADDRESS, datetime = new Date(), network = 'mainnet' } = req.query as unknown as FetchReconfigureRequest;
  const { config, dolt } = await handlerReq(space, req.headers.authorization);
  const ens = await getENS(address);
  const { gnosisSafeAddress } = config.juicebox;
  const memo = `submitted by ${ens} at ${datetime} from juicetool & nance`;
  const currentNonce = await GnosisHandler.getCurrentNonce(gnosisSafeAddress, network).then((nonce: string) => {
    return nonce;
  }).catch((e: any) => {
    dolt.localDolt.closeConnection();
    return res.json({ success: false, error: e });
  });
  if (!currentNonce) { return res.json({ success: false, error: 'safe not found' }); }
  const nonce = (Number(currentNonce) + 1).toString();
  const treasury = new NanceTreasury(config, dolt, myProvider(config.juicebox.network));
  dolt.localDolt.closeConnection();
  return res.send(
    await treasury.fetchReconfiguration(version as string, memo).then((txn: any) => {
      return { success: true, data: { safe: gnosisSafeAddress, transaction: txn, nonce } };
    }).catch((e: any) => {
      dolt.localDolt.closeConnection();
      return { success: false, error: e };
    })
  );
});

// ===================================== //
// ======== admin-ish functions ======== //
// ===================================== //

// increment governance cycle
router.put('/:space/incrementGC', async (req, res) => {
  const { space } = req.params;
  const { dolt, spaceOwners, address } = await handlerReq(space, req.headers.authorization);
  if (!address) { res.json({ success: false, error: '[NANCE ERROR]: no address' }); return; }
  if (isNanceAddress(address) || isNanceSpaceOwner(spaceOwners, address)) {
    logger.info(`INCREMENT GC by ${address}`);
    dolt.incrementGovernanceCycle().then((data) => {
      dolt.localDolt.closeConnection();
      res.json({ success: true, data });
    }).catch((e) => {
      dolt.localDolt.closeConnection();
      res.json({ success: false, error: e });
    });
  }
});

// edit discord titles
router.get('/:space/editTitles/:status', async (req, res) => {
  const { space, status } = req.params;
  const { message } = req.query;
  const { config } = await handlerReq(space, req.headers.authorization);
  const nance = new Nance(config);
  // eslint-disable-next-line no-await-in-loop
  while (!nance.dialogHandler.ready()) { await sleep(50); }
  nance.editTitles(status, message as string).then((data) => {
    nance.dProposalHandler.localDolt.closeConnection();
    res.json({ success: true, data });
  }).catch((e) => {
    nance.dProposalHandler.localDolt.closeConnection();
    res.json({ success: false, error: e });
  });
});

// check for changes to db, push to dolt if true
router.get('/:space/dolthub', async (req, res) => {
  const { space } = req.params;
  const { table } = req.query as { table: string | undefined };
  const { dolt, calendar } = await handlerReq(space, req.headers.authorization);
  const currentEvent = calendar.getCurrentEvent();
  dolt.checkAndPush(table, currentEvent?.title || '').then((data: string) => {
    dolt.localDolt.closeConnection();
    return res.json({ success: true, data });
  }).catch((e: string) => {
    dolt.localDolt.closeConnection();
    return res.json({ success: false, error: e });
  });
});

// ===================================== //
// ========= payout functions ========== //
// ===================================== //

// get payouts table
router.get('/:space/payouts', async (req, res) => {
  const { space } = req.params;
  const { dolt } = await handlerReq(space, req.headers.authorization);
  dolt.getPayoutsDb('V3').then((data: SQLPayout[]) => {
    dolt.localDolt.closeConnection();
    res.json({ success: true, data });
  }).catch((e: any) => {
    dolt.localDolt.closeConnection();
    res.json({ success: false, error: e });
  });
});

// edit payouts table
router.put('/:space/payouts', async (req, res) => {
  const { space } = req.params;
  const { config, dolt, address } = await handlerReq(space, req.headers.authorization);
  const { payouts } = req.body as EditPayoutsRequest;
  if (!address) { dolt.localDolt.closeConnection(); res.json({ success: false, error: '[NANCE ERROR]: missing SIWE adddress for proposal upload' }); return; }
  const safeAddress = config.juicebox.gnosisSafeAddress;
  if (await isMultisig(safeAddress, address) || isNanceAddress(address)) {
    logger.info(`EDIT PAYOUTS by ${address}`);
    dolt.bulkEditPayouts(payouts).then(() => {
      dolt.localDolt.closeConnection();
      res.json({ success: true });
    }).catch((e: any) => { res.json({ success: false, error: e }); });
    dolt.localDolt.closeConnection();
  } else { res.json({ success: false, error: '[PERMISSIONS] User not authorized to edit payouts' }); }
});

router.get('/:space/payouts/stale', async (req, res) => {
  const { space } = req.params;
  const { dolt } = await handlerReq(space, req.headers.authorization);
  dolt.setStalePayouts().then((updated: number) => {
    dolt.localDolt.closeConnection();
    res.json({ success: true, data: { numUpdated: updated } });
  });
});

router.get('/:space/payouts/rollup', async (req, res) => {
  const { space } = req.params;
  const { config, dolt } = await handlerReq(space, req.headers.authorization);
  const dialogHandler = new DiscordHandler(config);
  const payouts = await dolt.getPayoutsDb();
  const currentGovernanceCycle = (await dolt.getCurrentGovernanceCycle()).toString();
  // eslint-disable-next-line no-await-in-loop
  while (!dialogHandler.ready()) { await sleep(50); }
  dialogHandler.sendPayoutsTable(payouts, currentGovernanceCycle).then(() => {
    dolt.localDolt.closeConnection();
    res.json({ success: true });
  }).catch((e: any) => {
    dolt.localDolt.closeConnection();
    res.json({ success: false, error: e });
  });
});

// ===================================== //
// ======== transfer functions ========= //
// ===================================== //

// get transfers table
router.get('/:space/transfers', async (req, res) => {
  const { space } = req.params;
  const { dolt } = await handlerReq(space, req.headers.authorization);
  dolt.getTransfersDb().then((data: SQLTransfer[]) => {
    dolt.localDolt.closeConnection();
    res.json({ success: true, data });
  }).catch((e: any) => {
    dolt.localDolt.closeConnection();
    res.json({ success: false, error: e });
  });
});

// tenderly simulation of multiple transactions, encoded using gnosis MultiCall
// pass in comma separated uuids of transactions to simulate as a query ex: ?uuids=uuid1,uuid2,uuid3...
router.get('/:space/simulate/multicall', async (req, res) => {
  const { space } = req.params;
  const { uuids, uuidOfProposal } = req.query as { uuids: string, uuidOfProposal: string };
  const { dolt, config } = await handlerReq(space, req.headers.authorization);
  const txn = (uuidOfProposal) ? await dolt.getTransactionsByProposalUuid(uuidOfProposal) : await dolt.getTransactionsByUuids(uuids.split(','));
  if (!txn || txn.length === 0) { res.json({ success: false, error: 'no transaction found' }); return; }
  const signer = (await GnosisHandler.getSigners(config.juicebox.gnosisSafeAddress))[0]; // get the first signer to encode MultiCall
  const encodedTransactions = await encodeGnosisMulticall(txn, signer);
  const tenderly = new TenderlyHandler({ account: 'jigglyjams', project: 'nance' });
  tenderly.simulate(encodedTransactions.data, config.juicebox.gnosisSafeAddress, signer, true).then((tenderlyResults) => {
    dolt.localDolt.closeConnection();
    res.json({ success: true, data: { ...tenderlyResults, transactionCount: encodedTransactions.count, transactions: encodedTransactions.transactions } });
  }).catch((e) => {
    dolt.localDolt.closeConnection();
    res.json({ success: false, error: e });
  });
});

export default router;

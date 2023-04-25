import express from 'express';
import { Nance } from '../nance';
import { NotionHandler } from '../notion/notionHandler';
import { NanceTreasury } from '../treasury';
import { doltConfig } from '../configLoader';
import logger from '../logging';
import { ProposalUploadRequest, FetchReconfigureRequest, ProposalDeleteRequest, IncrementGovernanceCycleRequest, EditPayoutsRequest } from './models';
import { checkSignature } from './helpers/signature';
import { GnosisHandler } from '../gnosis/gnosisHandler';
import { getENS } from './helpers/ens';
import { getLastSlash, myProvider, sleep } from '../utils';
import { CalendarHandler } from '../calendar/CalendarHandler';
import { DoltHandler } from '../dolt/doltHandler';
import { DiscordHandler } from '../discord/discordHandler';
import { dbOptions } from '../dolt/dbConfig';
import { SQLPayout, SQLTransfer } from '../dolt/schema';
import { Proposal } from '../types';
import { diffBody } from './helpers/diff';
import { isMultisig, isNanceAddress } from './helpers/permissions';

const router = express.Router();
const spacePrefix = '/:space';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

router.use(spacePrefix, async (req, res, next) => {
  const { space } = req.params;
  try {
    const { config, calendar } = await doltConfig(space);
    const proposalHandlerMain = (config.notion && config.notion.enabled) ? new NotionHandler(config) : new DoltHandler(dbOptions(config.dolt.repo), config.propertyKeys);
    const proposalHandlerBeta = new DoltHandler(dbOptions(config.dolt.repo), config.propertyKeys);
    res.locals = { space, config, calendar, proposalHandlerMain, proposalHandlerBeta };
    next();
  } catch (e) {
    res.json({ success: false, error: `space ${space} not found!` });
  }
});

// ================================ //
// ======== info functions ======== //
// ================================ //
router.get(`${spacePrefix}`, async (_, res) => {
  const { proposalHandlerMain, space, calendar } = res.locals;
  try {
    const calendarHandler = new CalendarHandler(calendar);
    const currentEvent = calendarHandler.getCurrentEvent();
    const currentCycle = await proposalHandlerMain.getCurrentGovernanceCycle();
    return res.send({ sucess: true, data: { name: space, currentCycle, currentEvent } });
  } catch (e) {
    return res.send({ success: false, error: `[NANCE ERROR]: ${e}` });
  }
});

// ===================================== //
// ======== proposals functions ======== //
// ===================================== //

// query proposals
router.get(`${spacePrefix}/proposals`, async (req, res) => {
  const { cycle, keyword } = req.query;
  const { proposalHandlerMain, proposalHandlerBeta } = res.locals;
  let data;
  try {
    if (!keyword && !cycle) {
      const cycleSearch: string = cycle || await proposalHandlerMain.getCurrentGovernanceCycle();
      data = await proposalHandlerBeta.getProposalsByGovernanceCycle(cycleSearch);
    }
    if (!keyword && cycle) { data = await proposalHandlerBeta.getProposalsByGovernanceCycle(cycle); }
    if (keyword && !cycle) { data = await proposalHandlerBeta.getProposalsByKeyword(keyword); }
    if (keyword && cycle) { data = await proposalHandlerBeta.getProposalsByGovernanceCycleAndKeyword(cycle, keyword); }
    return res.send({ success: true, data });
  } catch (e) {
    return res.send({ success: false, error: `[NANCE] ${e}` });
  }
});

// upload new proposal
router.post(`${spacePrefix}/proposals`, async (req, res) => {
  const { space } = req.params;
  const { proposal, signature } = req.body as ProposalUploadRequest;
  const { config, proposalHandlerMain, proposalHandlerBeta } = res.locals;
  if (!proposal || !signature) res.json({ success: false, error: '[NANCE ERROR]: proposal object validation fail' });
  const { valid, typedValue } = checkSignature(signature, space, 'upload', proposal);
  if (!valid) {
    logger.warn(`[UPLOAD] space: ${space}, address: ${signature.address} bad`);
    logger.warn(signature);
    logger.warn(typedValue);
    res.json({ success: false, error: '[NANCE ERROR]: bad signature' });
    return;
  }
  logger.debug(`[UPLOAD] space: ${space}, address: ${signature.address} good`);
  if (!proposal.governanceCycle) {
    const currentGovernanceCycle = await proposalHandlerMain.getCurrentGovernanceCycle();
    proposal.governanceCycle = currentGovernanceCycle + 1;
  }
  if (proposal.payout?.type === 'project') proposal.payout.address = `V${proposal.version}:${proposal.payout.project}`;
  if (!proposal.authorAddress) { proposal.authorAddress = signature.address; }
  if (!proposal.type) { proposal.type = 'Payout'; }

  proposalHandlerMain.addProposalToDb(proposal).then(async (hash: string) => {
    proposal.hash = hash;
    proposalHandlerBeta.addProposalToDb(proposal);
    proposalHandlerBeta.actionDirector(proposal);

    // if notion is not enabled then send proposal discussion to dialog handler, otherwise it will get picked up by cron job checking notion
    if (!config.notion.enabled && config.dolt.enabled && config.discord.guildId) {
      const dialogHandler = new DiscordHandler(config);
      // eslint-disable-next-line no-await-in-loop
      while (!dialogHandler.ready()) { await sleep(50); }
      dialogHandler.startDiscussion(proposal).then((discussionThreadURL) => {
        proposalHandlerMain.updateDiscussionURL({ ...proposal, discussionThreadURL });
        dialogHandler.setupPoll(getLastSlash(discussionThreadURL));
      });
    }
    res.json({ success: true, data: { hash } });
  }).catch((e: any) => {
    res.json({ success: false, error: `[DATABASE ERROR]: ${e}` });
  });
});

// =========================================== //
// ======== single proposal functions ======== //
// =========================================== //

// get specific proposal by uuid, snapshotId, proposalId-#, or just proposalId #
router.get(`${spacePrefix}/proposal/:pid`, async (req, res) => {
  const { pid } = req.params;
  const { proposalHandlerBeta } = res.locals;
  return res.send(
    await proposalHandlerBeta.getProposalByAnyId(pid).then((proposal: Proposal[]) => {
      if (proposal.length === 0) return { success: false, error: 'proposal not found' };
      return { sucess: true, data: proposal };
    }).catch((e: any) => {
      return { success: false, error: e };
    })
  );
});

// edit single proposal
router.put(`${spacePrefix}/proposal/:pid`, async (req, res) => {
  const { space, pid } = req.params;
  const { proposal, signature } = req.body as ProposalUploadRequest;
  const { proposalHandlerBeta, config } = res.locals;
  const { valid } = checkSignature(signature, space, 'edit', proposal);
  if (!valid) { res.json({ success: false, error: '[NANCE ERROR]: bad signature' }); }
  const proposalByUuid = await proposalHandlerBeta.getContentMarkdown(pid) as Proposal;
  if (proposalByUuid.status === 'Voting' || proposalByUuid.status === 'Approved') {
    res.json({ success: false, error: '[NANCE ERROR]: proposal edits no longer allowed' });
    return;
  }
  if (signature.address === proposalByUuid.authorAddress || isNanceAddress(signature.address)) {
    logger.info(`EDIT issued by ${signature.address} for uuid: ${proposal.hash}`);
    proposalHandlerBeta.editProposal(proposal).then(async (hash: string) => {
      const diff = diffBody(proposalByUuid.body || '', proposal.body || '');
      if (proposalByUuid.discussionThreadURL && diff) {
        const discord = new DiscordHandler(config);
        // eslint-disable-next-line no-await-in-loop
        while (!discord.ready()) { await sleep(50); }
        discord.sendProposalDiff(getLastSlash(proposalByUuid.discussionThreadURL), diff, pid);
      }
      res.json({ success: true, data: { hash } });
    }).catch((e: any) => {
      res.json({ success: false, error: e });
    });
  } else {
    res.json({ success: false, error: 'not authorized to edit proposal' });
  }
});

// delete single proposal
router.delete(`${spacePrefix}/proposal/:hash`, async (req, res) => {
  const { space, hash } = req.params;
  const { signature } = req.body as ProposalDeleteRequest;
  const { proposalHandlerBeta } = res.locals;
  const { valid } = checkSignature(signature, space, 'delete', { hash });
  if (!valid) { res.json({ success: false, error: '[NANCE ERROR]: bad signature' }); }
  const proposalByUuid = await proposalHandlerBeta.getContentMarkdown(hash);
  if (signature.address === proposalByUuid.authorAddress || isNanceAddress(signature.address)) {
    logger.info(`DELETE issued by ${signature.address}`);
    proposalHandlerBeta.deleteProposal(hash).then(async (affectedRows: number) => {
      res.json({ success: true, data: { affectedRows } });
    }).catch((e: any) => {
      res.json({ success: false, error: e });
    });
  } else { res.json({ success: false, error: '[PERMISSIONS] User not authorized to delete proposal' }); }
});

// ==================================== //
// ======== multisig functions ======== //
// ==================================== //

router.get(`${spacePrefix}/reconfigure`, async (req, res) => {
  const { version = 'V3', address = ZERO_ADDRESS, datetime = new Date(), network = 'mainnet' } = req.query as unknown as FetchReconfigureRequest;
  const { config, proposalHandlerBeta } = res.locals;
  const ens = await getENS(address);
  const { gnosisSafeAddress } = config.juicebox;
  const memo = `submitted by ${ens} at ${datetime} from juicetool & nance`;
  const currentNonce = await GnosisHandler.getCurrentNonce(gnosisSafeAddress, network).then((nonce: string) => {
    return nonce;
  }).catch((e: any) => {
    return res.json({ success: false, error: e });
  });
  if (!currentNonce) { return res.json({ success: false, error: 'safe not found' }); }
  const nonce = (Number(currentNonce) + 1).toString();
  const treasury = new NanceTreasury(config, proposalHandlerBeta, myProvider(config.juicebox.network));
  return res.send(
    await treasury.fetchReconfiguration(version as string, memo).then((txn: any) => {
      return { success: true, data: { safe: gnosisSafeAddress, transaction: txn, nonce } };
    }).catch((e: any) => {
      return { success: false, error: e };
    })
  );
});

// ===================================== //
// ======== admin-ish functions ======== //
// ===================================== //

// increment governance cycle
router.put(`${spacePrefix}/incrementGC`, async (req, res) => {
  const { space } = req.params;
  const { governanceCycle, signature } = req.body as IncrementGovernanceCycleRequest;
  const { proposalHandlerMain } = res.locals;
  const { valid } = checkSignature(signature, space, 'incrementGC', { governanceCycle });
  if (!valid) { res.json({ success: false, error: '[NANCE ERROR]: bad signature' }); }
  if (isNanceAddress(signature.address)) {
    logger.info(`INCREMENT GC by ${signature.address}`);
    proposalHandlerMain.incrementGovernanceCycle().then((affectedRows: number) => {
      res.json({ success: true, data: { affectedRows } });
    }).catch((e: any) => {
      res.json({ success: false, error: e });
    });
  }
});

// edit discord titles
router.get(`${spacePrefix}/editTitles/:status`, async (req, res) => {
  const { status } = req.params;
  const { message } = req.query;
  const { config } = res.locals;
  const nance = new Nance(config);
  // eslint-disable-next-line no-await-in-loop
  while (!nance.dialogHandler.ready()) { await sleep(50); }
  nance.editTitles(status, message as string).then((data) => {
    res.json({ success: true, data });
  }).catch((e) => {
    res.json({ success: false, error: e });
  });
});

// sync notion to dolt
router.get(`${spacePrefix}/sync`, async (_, res) => {
  const { config } = res.locals;
  const nance = new Nance(config);
  await nance.syncProposalHandlers().then(() => {
    res.json({ success: true });
  }).catch((e) => {
    res.json({ success: false, error: e });
  });
});

// check for changes to db, push to dolt if true
router.get(`${spacePrefix}/dolthub`, async (req, res) => {
  const { table } = req.query;
  const { proposalHandlerBeta, calendar } = res.locals;
  const calendarHandler = new CalendarHandler(calendar);
  const currentEvent = calendarHandler.getCurrentEvent();
  proposalHandlerBeta.checkAndPush(table, currentEvent.title).then((data: string) => {
    return res.json({ success: true, data });
  }).catch((e: string) => {
    return res.json({ success: false, error: e });
  });
});

// ===================================== //
// ========= payout functions ========== //
// ===================================== //

// get payouts table
router.get(`${spacePrefix}/payouts`, async (_, res) => {
  const { proposalHandlerBeta } = res.locals;
  proposalHandlerBeta.getPayoutsDb('V3').then((data: SQLPayout[]) => {
    res.json({ success: true, data });
  }).catch((e: any) => {
    res.json({ success: false, error: e });
  });
});

// edit payouts table
router.put(`${spacePrefix}/payouts`, async (req, res) => {
  const { space, config, proposalHandlerBeta } = res.locals;
  const { payouts, signature } = req.body as EditPayoutsRequest;
  const { valid } = checkSignature(signature, space, 'payouts', { payouts });
  if (!valid) { res.json({ success: false, error: '[NANCE ERROR]: bad signature' }); return; }
  const safeAddress = config.juicebox.gnosisSafeAddress;
  const { address } = signature;
  if (await isMultisig(safeAddress, address) || isNanceAddress(address)) {
    logger.info(`EDIT PAYOUTS by ${address}`);
    proposalHandlerBeta.bulkEditPayouts(payouts).then(() => {
      res.json({ success: true });
    }).catch((e: any) => { res.json({ success: false, error: e }); });
  } else { res.json({ success: false, error: '[PERMISSIONS] User not authorized to edit payouts' }); }
});

// ===================================== //
// ======== transfer functions ========= //
// ===================================== //

// get transfers table
router.get(`${spacePrefix}/transfers`, async (_, res) => {
  const { proposalHandlerBeta } = res.locals;
  proposalHandlerBeta.getTransfersDb().then((data: SQLTransfer[]) => {
    res.json({ success: true, data });
  }).catch((e: any) => {
    res.json({ success: false, error: e });
  });
});

export default router;

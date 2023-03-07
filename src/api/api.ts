import express from 'express';
import { Nance } from '../nance';
import { NotionHandler } from '../notion/notionHandler';
import { NanceTreasury } from '../treasury';
import { cidConfig, DEFAULT_GATEWAY } from '../configLoader';
import logger from '../logging';
import { ProposalUploadRequest, FetchReconfigureRequest, ProposalDeleteRequest, IncrementGovernanceCycleRequest } from './models';
import { checkSignature } from './helpers/signature';
import { GnosisHandler } from '../gnosis/gnosisHandler';
import { getAddressFromPrivateKey, getENS } from './helpers/ens';
import { cidToLink, myProvider, sleep } from '../utils';
import { CalendarHandler } from '../calendar/CalendarHandler';
import { DoltHandler } from '../dolt/doltHandler';
import { DiscordHandler } from '../discord/discordHandler';
import { keys } from '../keys';
import { dbOptions } from '../dolt/dbConfig';
import { SQLPayout } from '../dolt/schema';
import { Proposal } from '../types';

const router = express.Router();
const spacePrefix = '/:space';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

router.use(spacePrefix, async (req, res, next) => {
  const { space } = req.params;
  try {
    const { config, calendar } = await cidConfig(space);
    const proposalHandlerMain = (config.notion.enabled) ? new NotionHandler(config) : new DoltHandler(dbOptions(config.dolt.repo), config.propertyKeys);
    const proposalHandlerBeta = (config.notion.enabled && config.dolt.enabled) ? new DoltHandler(dbOptions(config.dolt.repo), config.propertyKeys) : undefined;
    res.locals = { space, config, calendar, proposalHandlerMain, proposalHandlerBeta };
    next();
  } catch (e) {
    res.json({ success: false, error: `space ${space} not found!` });
  }
});

// ================================ //
// ======== info functions ======== //
// ================================ //
router.get(`${spacePrefix}`, async (req, res) => {
  const { proposalHandlerMain, space, calendar } = res.locals;
  try {
    const calendarHandler = new CalendarHandler();
    await calendarHandler.useIcsLink(cidToLink(calendar, DEFAULT_GATEWAY));
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
  if (!proposal) res.json({ success: false, error: '[NANCE ERROR]: proposal object validation fail' });
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

  proposalHandlerMain.addProposalToDb(proposal).then(async (hash: string) => {
    proposal.hash = hash;
    if (proposalHandlerBeta) { proposalHandlerBeta.addProposalToDb(proposal); }

    // if notion is not enabled then send proposal discussion to dialog handler, otherwise it will get picked up by cron job checking notion
    if (!config.notion.enabled && config.dolt.enabled && config.discord.guildId) {
      const dialogHandler = new DiscordHandler(config);
      // eslint-disable-next-line no-await-in-loop
      while (!dialogHandler.ready()) { await sleep(50); }
      dialogHandler.startDiscussion(proposal).then((discussionThreadURL) => {
        proposalHandlerMain.updateDiscussionURL({ ...proposal, discussionThreadURL });
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
      return { sucess: true, data: proposal[0] };
    }).catch((e: any) => {
      return { success: false, error: e };
    })
  );
});

// edit single proposal
router.put(`${spacePrefix}/proposal/:pid`, async (req, res) => {
  const { space, pid } = req.params;
  const { proposal, signature } = req.body as ProposalUploadRequest;
  const { proposalHandlerBeta } = res.locals;
  const { valid } = checkSignature(signature, space, 'edit', proposal);
  if (!valid) { res.json({ success: false, error: '[NANCE ERROR]: bad signature' }); }
  const proposalByUuid = await proposalHandlerBeta.getContentMarkdown(pid);
  if (signature.address === proposalByUuid.authorAddress || signature.address === getAddressFromPrivateKey(keys.PRIVATE_KEY)) {
    logger.info(`EDIT issued by ${signature.address}`);
    proposalHandlerBeta.addProposalToDb(proposal, true).then((hash: string) => {
      res.json({ success: true, data: { hash } });
    }).catch((e: any) => {
      res.json({ success: false, error: e });
    });
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
  if (signature.address === proposalByUuid.authorAddress || signature.address === getAddressFromPrivateKey(keys.PRIVATE_KEY)) {
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
  const currentNonce = await GnosisHandler.getCurrentNonce(gnosisSafeAddress, network);
  if (!currentNonce) { return res.json({ success: false, error: 'safe not found' }); }
  const nonce = (Number(currentNonce) + 1).toString();
  const treasury = new NanceTreasury(config, proposalHandlerBeta, myProvider(config.juicebox.network));
  return res.send(
    await treasury.fetchReconfiguration(version as string, memo).then((txn: any) => {
      return { success: true, data: { safe: gnosisSafeAddress, transaction: txn, nonce } };
    }).catch((e: any) => {
      return { success: false, error: e.reason };
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
  const { config, proposalHandlerMain } = res.locals;
  const { valid } = checkSignature(signature, space, 'incrementGC', { governanceCycle });
  if (!valid) { res.json({ success: false, error: '[NANCE ERROR]: bad signature' }); }
  if (signature.address === getAddressFromPrivateKey(keys.PRIVATE_KEY)) {
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

// get payouts table
router.get(`${spacePrefix}/payouts`, async (req, res) => {
  const { proposalHandlerBeta } = res.locals;
  proposalHandlerBeta.getPayoutsDb('V3').then((data: SQLPayout[]) => {
    res.json({ success: true, data });
  }).catch((e: any) => {
    res.json({ success: false, error: e });
  });
});

// sync notion to dolt
router.get(`${spacePrefix}/sync`, async (req, res) => {
  const { config } = res.locals;
  const nance = new Nance(config);
  await nance.syncProposalHandlers().then(() => {
    res.json({ success: true });
  }).catch((e) => {
    res.json({ success: false, error: e });
  });
});

export default router;

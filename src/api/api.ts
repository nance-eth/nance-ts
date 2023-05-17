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
import { NanceConfig, Proposal } from '../types';
import { diffBody } from './helpers/diff';
import { isMultisig, isNanceAddress, isNanceSpaceOwner } from './helpers/permissions';
import { headToUrl } from '../dolt/doltAPI';

const router = express.Router();
const spacePrefix = '/:space';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

type Locals = { space: string, spaceOwners: string[], config: NanceConfig, calendar: CalendarHandler, notion: NotionHandler, dolt: DoltHandler };

router.use(spacePrefix, async (req, res, next) => {
  const { space } = req.params;
  try {
    const { config, calendarText, spaceOwners } = await doltConfig(space);
    let notion = null;
    if (config.notion?.enabled) { notion = new NotionHandler(config); }
    const dolt = new DoltHandler(dbOptions(config.dolt.repo), config.propertyKeys);
    const calendar = new CalendarHandler(calendarText);
    res.locals = { space, spaceOwners, config, calendar, notion, dolt };
    next();
  } catch (e) {
    res.json({ success: false, error: `space ${space} not found!` });
  }
});

// ================================ //
// ======== info functions ======== //
// ================================ //
router.get(`${spacePrefix}`, async (_, res) => {
  const { dolt, space, calendar, config } = res.locals as Locals;
  try {
    const currentEvent = calendar.getCurrentEvent();
    const currentCycle = await dolt.getCurrentGovernanceCycle();
    const head = await dolt.getHead();
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
router.get(`${spacePrefix}/proposals`, async (req, res) => {
  const { cycle, keyword } = req.query as { cycle: string, keyword: string };
  const { dolt } = res.locals as Locals;
  let data;
  try {
    if (!keyword && !cycle) {
      const cycleSearch = cycle || (await dolt.getCurrentGovernanceCycle()).toString();
      data = await dolt.getProposalsByGovernanceCycle(cycleSearch);
    }
    if (!keyword && cycle) { data = await dolt.getProposalsByGovernanceCycle(cycle); }
    if (keyword && !cycle) { data = await dolt.getProposalsByKeyword(keyword); }
    if (keyword && cycle) { data = await dolt.getProposalsByGovernanceCycleAndKeyword(cycle, keyword); }
    return res.send({ success: true, data });
  } catch (e) {
    return res.send({ success: false, error: `[NANCE] ${e}` });
  }
});

// upload new proposal
router.post(`${spacePrefix}/proposals`, async (req, res) => {
  const { space } = req.params;
  const { proposal, signature } = req.body as ProposalUploadRequest;
  const { config, calendar, notion, dolt } = res.locals as Locals;
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
    const currentGovernanceCycle = await dolt.getCurrentGovernanceCycle();
    proposal.governanceCycle = currentGovernanceCycle + 1;
  }
  if (!proposal.authorAddress) { proposal.authorAddress = signature.address; }

  dolt.addProposalToDb(proposal).then(async (hash: string) => {
    proposal.hash = hash;
    if (notion) notion.addProposalToDb(proposal);
    dolt.actionDirector(proposal);

    // send discord message
    if (proposal.status === 'Discussion' && calendar.shouldSendDiscussion()) {
      const dialogHandler = new DiscordHandler(config);
      // eslint-disable-next-line no-await-in-loop
      while (!dialogHandler.ready()) { await sleep(50); }
      try {
        const discussionThreadURL = await dialogHandler.startDiscussion(proposal);
        dialogHandler.setupPoll(getLastSlash(discussionThreadURL));
        if (notion) notion.updateDiscussionURL({ ...proposal, discussionThreadURL });
        dolt.updateDiscussionURL({ ...proposal, discussionThreadURL });
      } catch (e) {
        logger.error(`[DISCORD] ${e}`);
      }
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
  const { dolt } = res.locals as Locals;
  return res.send(
    await dolt.getProposalByAnyId(pid).then((proposal: Proposal) => {
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
  const { dolt, config } = res.locals as Locals;
  const { valid } = checkSignature(signature, space, 'edit', proposal);
  if (!valid) { res.json({ success: false, error: '[NANCE ERROR]: bad signature' }); }
  const proposalByUuid = await dolt.getProposalByAnyId(pid);
  if (proposalByUuid.status !== 'Discussion' && proposalByUuid.status !== 'Draft') {
    res.json({ success: false, error: '[NANCE ERROR]: proposal edits no longer allowed' });
    return;
  }
  proposal.coauthors = proposalByUuid.coauthors ?? [];
  if (!proposalByUuid.coauthors?.includes(signature.address) && signature.address !== proposalByUuid.authorAddress) {
    proposal.coauthors.push(signature.address);
  }
  logger.info(`EDIT issued by ${signature.address} for uuid: ${proposal.hash}`);
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
      await discord.sendProposalDiff(getLastSlash(proposalByUuid.discussionThreadURL), diff, pid);
      discord.logout();
    }
    res.json({ success: true, data: { hash } });
  }).catch((e: any) => {
    res.json({ success: false, error: JSON.stringify(e) });
  });
});

// delete single proposal
router.delete(`${spacePrefix}/proposal/:hash`, async (req, res) => {
  const { space, hash } = req.params;
  const { signature } = req.body as ProposalDeleteRequest;
  const { dolt, config, spaceOwners } = res.locals as Locals;
  const { valid } = checkSignature(signature, space, 'delete', { hash });
  if (!valid) { res.json({ success: false, error: '[NANCE ERROR]: bad signature' }); }
  dolt.getProposalByAnyId(hash).then(async (proposalByUuid: Proposal) => {
    if (proposalByUuid.status !== 'Discussion' && proposalByUuid.status !== 'Draft') {
      res.json({ success: false, error: '[NANCE ERROR]: proposal edits no longer allowed' });
      return;
    }
    const permissions = (
      signature.address === proposalByUuid.authorAddress
      || await isMultisig(config.juicebox.gnosisSafeAddress, signature.address)
      || isNanceSpaceOwner(spaceOwners, signature.address)
      || isNanceAddress(signature.address)
    );
    if (permissions) {
      logger.info(`DELETE issued by ${signature.address}`);
      dolt.deleteProposal(hash).then(async (affectedRows: number) => {
        res.json({ success: true, data: { affectedRows } });
      }).catch((e: any) => {
        res.json({ success: false, error: e });
      });
    } else { res.json({ success: false, error: '[PERMISSIONS] User not authorized to  proposal' }); }
  }).catch((e) => {
    console.log(e);
    res.json({ success: false, error: 'proposal not found' });
  });
});

// ==================================== //
// ======== multisig functions ======== //
// ==================================== //

router.get(`${spacePrefix}/reconfigure`, async (req, res) => {
  const { version = 'V3', address = ZERO_ADDRESS, datetime = new Date(), network = 'mainnet' } = req.query as unknown as FetchReconfigureRequest;
  const { config, dolt } = res.locals as Locals;
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
  const treasury = new NanceTreasury(config, dolt, myProvider(config.juicebox.network));
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
  const { dolt } = res.locals as Locals;
  const { valid } = checkSignature(signature, space, 'incrementGC', { governanceCycle });
  if (!valid) { res.json({ success: false, error: '[NANCE ERROR]: bad signature' }); }
  if (isNanceAddress(signature.address)) {
    logger.info(`INCREMENT GC by ${signature.address}`);
    dolt.incrementGovernanceCycle().then((data) => {
      res.json({ success: true, data });
    }).catch((e) => {
      res.json({ success: false, error: e });
    });
  }
});

// edit discord titles
router.get(`${spacePrefix}/editTitles/:status`, async (req, res) => {
  const { status } = req.params;
  const { message } = req.query;
  const { config } = res.locals as Locals;
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
  const { config } = res.locals as Locals;
  const nance = new Nance(config);
  await nance.syncProposalHandlers().then(() => {
    res.json({ success: true });
  }).catch((e) => {
    res.json({ success: false, error: e });
  });
});

// check for changes to db, push to dolt if true
router.get(`${spacePrefix}/dolthub`, async (req, res) => {
  const { table } = req.query as { table: string | undefined };
  const { dolt, calendar } = res.locals as Locals;
  const currentEvent = calendar.getCurrentEvent();
  dolt.checkAndPush(table, currentEvent?.title || '').then((data: string) => {
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
  const { dolt } = res.locals as Locals;
  dolt.getPayoutsDb('V3').then((data: SQLPayout[]) => {
    res.json({ success: true, data });
  }).catch((e: any) => {
    res.json({ success: false, error: e });
  });
});

// edit payouts table
router.put(`${spacePrefix}/payouts`, async (req, res) => {
  const { space, config, dolt } = res.locals as Locals;
  const { payouts, signature } = req.body as EditPayoutsRequest;
  const { valid } = checkSignature(signature, space, 'payouts', { payouts });
  if (!valid) { res.json({ success: false, error: '[NANCE ERROR]: bad signature' }); return; }
  const safeAddress = config.juicebox.gnosisSafeAddress;
  const { address } = signature;
  if (await isMultisig(safeAddress, address) || isNanceAddress(address)) {
    logger.info(`EDIT PAYOUTS by ${address}`);
    dolt.bulkEditPayouts(payouts).then(() => {
      res.json({ success: true });
    }).catch((e: any) => { res.json({ success: false, error: e }); });
  } else { res.json({ success: false, error: '[PERMISSIONS] User not authorized to edit payouts' }); }
});

// ===================================== //
// ======== transfer functions ========= //
// ===================================== //

// get transfers table
router.get(`${spacePrefix}/transfers`, async (_, res) => {
  const { dolt } = res.locals as Locals;
  dolt.getTransfersDb().then((data: SQLTransfer[]) => {
    res.json({ success: true, data });
  }).catch((e: any) => {
    res.json({ success: false, error: e });
  });
});

export default router;

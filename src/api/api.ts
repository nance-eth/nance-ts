import express from 'express';
import { Nance } from '../nance';
import { NotionHandler } from '../notion/notionHandler';
import { NanceTreasury } from '../treasury';
import { calendarPath, getConfig } from '../configLoader';
import { Proposal } from '../types';
import logger from '../logging';
import { ProposalUploadRequest, FetchReconfigureRequest, ProposalDeleteRequest } from './models';
import { checkSignature } from './helpers/signature';
import { GnosisHandler } from '../gnosis/gnosisHandler';
import { getAddressFromPrivateKey, getENS } from './helpers/ens';
import { sleep } from '../utils';
import { CalendarHandler } from '../calendar/CalendarHandler';
import { DoltHandler } from '../dolt/doltHandler';
import { DiscordHandler } from '../discord/discordHandler';
import { keys } from '../keys';

const router = express.Router();
const spacePrefix = '/:space';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

router.use(spacePrefix, async (req, res, next) => {
  const { space } = req.params;
  try {
    const config = await getConfig(space);
    res.locals.proposalHandlerMain = (config.notion.enabled) ? new NotionHandler(config) : new DoltHandler(config.dolt.repo, config.propertyKeys);
    res.locals.proposalHandlerBeta = (config.notion.enabled && config.dolt.enabled) ? new DoltHandler(config.dolt.repo, config.propertyKeys) : undefined;
    res.locals.spaceName = space;
    res.locals.config = config;
    next();
  } catch (e) {
    res.json({ success: false, error: `space ${space} not found!` });
  }
});

router.get(`${spacePrefix}`, async (req, res) => {
  const { proposalHandlerMain, spaceName, config } = res.locals;
  try {
    const calendar = new CalendarHandler(calendarPath(config));
    const currentEvent = calendar.getCurrentEvent();
    const currentCycle = await proposalHandlerMain.getCurrentGovernanceCycle();
    return res.send({ sucess: true, data: { name: spaceName, currentCycle, currentEvent } });
  } catch (e) {
    return res.send({ success: false, error: `[NANCE ERROR]: ${e}` });
  }
});

router.get(`${spacePrefix}/discussionHook`, async (req, res) => {
  const { config } = res.locals;
  const nance = new Nance(config);
  const calendar = new CalendarHandler(calendarPath(config));
  const shouldSendDiscussion = CalendarHandler.shouldSendDiscussion(calendar.getNextEvents());
  if (!shouldSendDiscussion) {
    res.json({ success: false, error: 'out of phase to send' });
    return;
  }
  // eslint-disable-next-line no-await-in-loop
  while (!nance.dialogHandler.ready()) { await sleep(50); }
  nance.queryAndSendDiscussions().then((discussions) => {
    nance.dialogHandler.logout();
    res.json({ success: true, data: discussions });
  }).catch((e) => {
    nance.dialogHandler.logout();
    res.json({ success: false, error: e });
  });
});

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

router.post(`${spacePrefix}/upload`, async (req, res) => {
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
  }
  logger.debug(`[UPLOAD] space: ${space}, address: ${signature.address} good`);
  if (!proposal.governanceCycle) {
    const currentGovernanceCycle = await proposalHandlerMain.getCurrentGovernanceCycle();
    proposal.governanceCycle = currentGovernanceCycle;
  }
  if (proposal.payout?.type === 'project') proposal.payout.address = `V${proposal.version}:${proposal.payout.project}`;
  if (!proposal.authorAddress) { proposal.authorAddress = signature.address; }

  proposalHandlerMain.addProposalToDb(proposal).then(async (hash: string) => {
    if (proposalHandlerBeta) { proposalHandlerBeta.addProposalToDb(proposal); }

    // if notion is not enabled then send proposal discussion to dialog handler, otherwise it will get picked up by cron job checking notion
    if (!config.notion.enabled && config.dolt.enabled) {
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

router.put(`${spacePrefix}/edit`, async (req, res) => {
  const { space } = req.params;
  const { proposal, signature } = req.body as ProposalUploadRequest;
  const { proposalHandlerMain } = res.locals;
  const { valid } = checkSignature(signature, space, 'edit', proposal);
  if (!valid) { res.json({ success: false, error: '[NANCE ERROR]: bad signature' }); }
  const proposalByUuid = proposalHandlerMain.getContentMarkdown(proposal.hash);
  if (signature.address === proposalByUuid.authorAddress || getAddressFromPrivateKey(keys.PRIVATE_KEY)) {
    logger.info(`EDIT issued by ${signature.address}`);
    proposalHandlerMain.addProposalToDb(proposal, true).then((hash: string) => {
      res.json({ success: true, data: { hash } });
    }).catch((e: any) => {
      res.json({ success: false, error: e });
    });
  }
});

router.put(`${spacePrefix}/delete`, async (req, res) => {
  const { space } = req.params;
  const { uuid, signature } = req.body as ProposalDeleteRequest;
  const { proposalHandlerMain } = res.locals;
  const { valid } = checkSignature(signature, space, 'delete', { uuid });
  if (!valid) { res.json({ success: false, error: '[NANCE ERROR]: bad signature' }); }
  const proposalByUuid = proposalHandlerMain.getContentMarkdown(uuid);
  if (signature.address === proposalByUuid.authorAddress || getAddressFromPrivateKey(keys.PRIVATE_KEY)) {
    logger.info(`DELETE issued by ${signature.address}`);
    proposalHandlerMain.deleteProposal(uuid).then((affectedRows: number) => {
      res.json({ success: true, data: { affectedRows } });
    }).catch((e: any) => {
      res.json({ success: false, error: e });
    });
  }
});

// juicebox/markdown?hash=6bb92c83571245949ecf1e495793e66b
router.get(`${spacePrefix}/proposal`, async (req, res) => {
  const { hash } = req.query;
  const { proposalHandlerMain } = res.locals;
  return res.send(
    await proposalHandlerMain.getContentMarkdown(hash).then((proposal: string) => {
      return { sucess: true, data: proposal };
    }).catch((e: any) => {
      return { success: false, error: `[NOTION ERROR]: ${e}` };
    })
  );
});

router.get(`${spacePrefix}/query`, async (req, res) => {
  const { cycle } = req.query;
  const { proposalHandlerMain } = res.locals;
  const cycleSearch: string = cycle || await proposalHandlerMain.getCurrentGovernanceCycle();
  return res.send(
    await proposalHandlerMain.getProposalsByGovernanceCycle(cycleSearch).then((proposals: Proposal[]) => {
      return { success: true, data: proposals };
    }).catch((e: any) => {
      return { success: false, error: `[NOTION ERROR]: ${e}` };
    })
  );
});

router.get(`${spacePrefix}/reconfigure`, async (req, res) => {
  const { version = 'V3', address = ZERO_ADDRESS, datetime = new Date(), network = 'mainnet' } = req.query as unknown as FetchReconfigureRequest;
  const { config, proposalHandlerMain } = res.locals;
  const ens = await getENS(address);
  const { gnosisSafeAddress } = config.juicebox;
  const memo = `submitted by ${ens} at ${datetime} from juicetool & nance`;
  const currentNonce = await GnosisHandler.getCurrentNonce(gnosisSafeAddress, network);
  if (!currentNonce) { return res.json({ success: false, error: 'safe not found' }); }
  const nonce = (Number(currentNonce) + 1).toString();
  const treasury = new NanceTreasury(config, proposalHandlerMain);
  return res.send(
    await treasury.fetchReconfiguration(version as string, memo).then((txn: any) => {
      return { success: true, data: { safe: gnosisSafeAddress, transaction: txn, nonce } };
    }).catch((e: any) => {
      return { success: false, error: e.reason };
    })
  );
});

export default router;

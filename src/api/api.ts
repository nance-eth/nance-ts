/* eslint-disable no-nested-ternary */
import express from 'express';
import { NotionHandler } from '../notion/notionHandler';
import { NanceTreasury } from '../treasury';
import { getConfig } from '../configLoader';
import { Proposal } from '../types';
import { SPACES } from '../config/map';
import logger from '../logging';

const router = express.Router();
const spacePrefix = '/:space';

router.use(spacePrefix, async (req, res, next) => {
  const { space } = req.params;
  // fetch space by projectId stored in SPACES enum or by space name string
  const query = Number(space);
  const spaceQuery = (Number.isNaN(query)) ? space : SPACES[query];
  try {
    const config = await getConfig(spaceQuery);
    res.locals.notion = new NotionHandler(config);
    res.locals.treasury = new NanceTreasury(config, res.locals.notion);
    res.locals.spaceName = spaceQuery;
    next();
  } catch (e) {
    res.json({ success: false, error: `space ${space} not found!` });
  }
});

router.post(`${spacePrefix}/upload`, async (req, res) => {
  const { space } = req.params;
  const {
    proposal
  } = req.body as Record<string, Proposal>;
  if (!proposal) res.json({ success: false, error: '[NOTION ERROR]: proposal object validation fail' });
  if (!proposal.governanceCycle) {
    const currentGovernanceCycle = await res.locals.notion.getCurrentGovernanceCycle();
    proposal.governanceCycle = currentGovernanceCycle;
  }
  if (proposal.payout?.type === 'project') proposal.payout.address = `V${proposal.version}:${proposal.payout.project}`;
  logger.debug(`[UPLOAD] space: ${space}`);
  logger.debug(proposal);
  await res.locals.notion.addProposalToDb(proposal).then((hash: string) => {
    res.json({ success: true, data: { hash } });
  }).catch((e: any) => {
    res.json({ success: false, error: `[NOTION ERROR]: ${JSON.parse(e.body).message}` });
  });
});

router.get(`${spacePrefix}`, async (req, res) => {
  return res.send(
    await res.locals.notion.getCurrentGovernanceCycle().then((currentCycle: string) => {
      return { sucess: true, data: { name: res.locals.spaceName, currentCycle } };
    }).catch((e: any) => {
      return { success: false, error: `[NOTION ERROR]: ${e}` };
    })
  );
});

// juicebox/markdown?hash=6bb92c83571245949ecf1e495793e66b
router.get(`${spacePrefix}/proposal`, async (req, res) => {
  const { hash } = req.query;
  return res.send(
    await res.locals.notion.getContentMarkdown(hash).then((proposal: string) => {
      return { sucess: true, data: proposal };
    }).catch((e: any) => {
      return { success: false, error: `[NOTION ERROR]: ${e}` };
    })
  );
});

router.get(`${spacePrefix}/query`, async (req, res) => {
  const { cycle } = req.query;
  const cycleSearch: string = cycle || await res.locals.notion.getCurrentGovernanceCycle();
  return res.send(
    await res.locals.notion.getProposalsByGovernanceCycle(cycleSearch).then((proposals: Proposal[]) => {
      return { success: true, data: proposals };
    }).catch((e: any) => {
      return { success: false, error: `[NOTION ERROR]: ${e}` };
    })
  );
});

router.get(`${spacePrefix}/reconfigure`, async (req, res) => {
  const { version } = req.query;
  return res.send(
    await res.locals.treasury.fetchReconfiguration(version).then((data: any) => {
      return { success: true, data };
    }).catch((e: any) => {
      return { success: false, error: e };
    })
  );
});

router.get(`${spacePrefix}/payouts`, async (req, res) => {
  const { version } = req.query;
  return res.send(
    await res.locals.treasury.fetchPayReserveDistribution(version).then((data: any) => {
      return { success: true, data };
    }).catch((e: any) => {
      return { success: false, error: e };
    })
  );
});

export default router;

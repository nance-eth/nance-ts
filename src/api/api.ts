/* eslint-disable no-nested-ternary */
import express from 'express';
import { NotionHandler } from '../notion/notionHandler';
import { getConfig } from '../configLoader';
import { Proposal } from '../types';
import { ProposalType, juicetoolToNotion } from './juicetoolTypes';
import { SPACES } from '../config/map';
import logger from '../logging';

const router = express.Router();
const spacePrefix = '/:space';

router.use(spacePrefix, async (request, response, next) => {
  const { space } = request.params;
  // fetch space by projectId stored in SPACES enum or by space name string
  const query = Number(space);
  const spaceQuery = (Number.isNaN(query)) ? space : SPACES[query];
  try {
    const config = await getConfig(spaceQuery);
    response.locals.notion = new NotionHandler(config);
    response.locals.spaceName = spaceQuery;
    next();
  } catch (e) {
    response.json({ success: false, error: `space ${space} not found!` });
  }
});

router.post(`${spacePrefix}/upload`, async (request, response) => {
  const { space } = request.params;
  const {
    proposal,
    payout,
    type,
    version
  } = request.body;
  proposal.type = juicetoolToNotion[type as ProposalType];
  if (!proposal.governanceCycle) {
    const currentGovernanceCycle = await response.locals.notion.getCurrentGovernanceCycle();
    const { governanceCyclePrefix } = response.locals.notion.config.notion.propertyKeys;
    proposal.governanceCycle = `${governanceCyclePrefix}${currentGovernanceCycle}`;
  }
  proposal.payout = {
    amountUSD: payout?.amount || '',
    count: payout?.duration || '',
    address: (payout?.type === 'address') ? payout?.address : (payout?.type === 'project') ? `V${version}:${payout?.project}` : '',
    treasuryVersion: `V${version}`
  };
  logger.debug(`[UPLOAD] space: ${space}`);
  logger.debug(proposal);
  await response.locals.notion.addProposalToDb(proposal).then((hash: string) => {
    response.json({ success: true, data: hash });
  }).catch((e: any) => {
    response.json({ success: false, error: e });
  });
});

router.get(`${spacePrefix}`, async (request, response) => {
  return response.send(
    await response.locals.notion.getCurrentGovernanceCycle().then((currentCycle: string) => {
      return {
        sucess: true,
        data: {
          name: response.locals.spaceName,
          currentCycle
        }
      };
    }).catch((e: any) => {
      return {
        success: false,
        error: e
      };
    })
  );
});

router.get(`${spacePrefix}/markdown`, async (request, response) => {
  const { hash } = request.query;
  return response.send(
    await response.locals.notion.getContentMarkdown(hash).then((markdown: string) => {
      return {
        sucess: true,
        data: markdown
      };
    }).catch((e: any) => {
      return {
        success: false,
        error: e
      };
    })
  );
});

router.get(`${spacePrefix}/query`, async (request, response) => {
  const { cycle } = request.query;
  const cycleSearch: string = cycle || await response.locals.notion.getCurrentGovernanceCycle();
  return response.send(
    await response.locals.notion.getProposalsByGovernanceCycle(cycleSearch).then((proposals: Proposal[]) => {
      return {
        success: true,
        data: proposals,
      };
    }).catch((e: any) => {
      return {
        success: false,
        error: e
      };
    })
  );
});

export default router;

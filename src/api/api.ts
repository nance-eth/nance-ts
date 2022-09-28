import express from 'express';
import { NotionHandler } from '../notion/notionHandler';
import { getConfig } from '../configLoader';
import { Proposal } from '../types';
import { ProposalType, juicetoolToNotion } from './juicetoolTypes';
import logger from '../logging';

const router = express.Router();
const spacePrefix = '/:space';

router.use(spacePrefix, async (request, response, next) => {
  const { space } = request.params;
  try {
    const config = await getConfig(space);
    response.locals.notion = new NotionHandler(config);
    next();
  } catch (e) {
    response.send(`ERROR: Space ${space} not found!`);
  }
});

router.post(`${spacePrefix}/upload`, async (request, response) => {
  // console.dir(request.body, { depth: null });
  const {
    proposal,
    payout,
    type,
    version
  } = request.body;
  proposal.markdown = proposal.body;
  proposal.category = juicetoolToNotion[type as ProposalType];
  if (!proposal.governanceCycle) {
    const currentGovernanceCycle = await response.locals.notion.getCurrentGovernanceCycle();
    const { governanceCyclePrefix } = response.locals.notion.config.notion.propertyKeys;
    proposal.governanceCycle = `${governanceCyclePrefix}${currentGovernanceCycle}`;
  }
  proposal.payout = {
    amountUSD: payout?.amount || '',
    count: payout?.duration || '',
    address: (payout.type === 'address') ? payout?.address : `V${version}:${payout.project}`,
    treasuryVersion: `V${version}`
  };
  logger.debug(proposal);
  await response.locals.notion.addProposalToDb(proposal).then((hash: string) => {
    response.json({ status: 'ok', data: hash });
  }).catch((e: any) => {
    response.json({ status: 'error', data: e });
  });
});

router.get(`${spacePrefix}/markdown`, async (request, response) => {
  const { hash } = request.query;
  return response.send(
    await response.locals.notion.getContentMarkdown(hash).then((data: string) => {
      return data;
    }).catch((e: any) => {
      return (e);
    })
  );
});

router.get(`${spacePrefix}/query/discussion`, async (request, response) => {
  return response.send(
    await response.locals.notion.getDiscussionProposals().then((data: Proposal[]) => {
      return data;
    }).catch((e: any) => {
      return (e);
    })
  );
});

router.get(`${spacePrefix}/query/temperatureCheck`, async (request, response) => {
  return response.send(
    await response.locals.notion.getTemperatureCheckProposals().then((data: Proposal[]) => {
      return data;
    }).catch((e: any) => {
      return (e);
    })
  );
});

router.get(`${spacePrefix}/query/vote`, async (request, response) => {
  return response.send(
    await response.locals.notion.getVoteProposals().then((data: Proposal[]) => {
      return data;
    }).catch((e: any) => {
      return (e);
    })
  );
});

router.get(`${spacePrefix}/query`, async (request, response) => {
  const { cycle } = request.query;
  const cycleSearch = cycle || await response.locals.notion.getCurrentGovernanceCycle();
  if (cycleSearch) {
    return response.send(
      await response.locals.notion.getProposalsByGovernanceCycle(cycleSearch).then((data: Proposal[]) => {
        return data;
      }).catch((e: any) => {
        return (e);
      })
    );
  } return response.send([]);
});

export default router;

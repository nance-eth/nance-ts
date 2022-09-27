import express from 'express';
import { NotionHandler } from '../notion/notionHandler';
import { getConfig } from '../configLoader';
import { Proposal } from '../types';
import { ProposalType, juicetoolToNotion } from './juicetoolTypes';

const router = express.Router();

router.use('/:space', async (request, response, next) => {
  const { space } = request.params;
  try {
    const config = await getConfig(space);
    response.locals.notion = new NotionHandler(config);
    next();
  } catch (e) {
    response.send(`ERROR: Space ${space} not found!`);
  }
});

router.post('/:space/upload', async (request, response) => {
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
  console.log(proposal);
  const uuid = await response.locals.notion.addProposalToDb(proposal);
  response.send('ok');
});

router.get('/:space/getPage/:pageId', async (request, response) => {
  const { pageId } = request.params;
  console.dir(await response.locals.notion.notion.pages.retrieve({ page_id: pageId }));
});

router.get('/:space/query/discussion', async (request, response) => {
  return response.send(
    await response.locals.notion.getDiscussionProposals().then((data: Proposal[]) => {
      return data;
    }).catch((e: any) => {
      return (e);
    })
  );
});

router.get('/:space/query/temperatureCheck', async (request, response) => {
  return response.send(
    await response.locals.notion.getTemperatureCheckProposals().then((data: Proposal[]) => {
      return data;
    }).catch((e: any) => {
      return (e);
    })
  );
});

router.get('/:space/query/vote', async (request, response) => {
  return response.send(
    await response.locals.notion.getVoteProposals().then((data: Proposal[]) => {
      return data;
    }).catch((e: any) => {
      return (e);
    })
  );
});

router.get('/:space/query', async (request, response) => {
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

import express from 'express';
import { NotionHandler } from '../notion/notionHandler';
import { getConfig } from '../configLoader';
import { Proposal } from '../types';

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
  const { proposal } = request.body;
  response.locals.notion.addProposalToDb(proposal);
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

export default router;

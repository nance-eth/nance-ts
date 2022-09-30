import { NotionHandler } from '../notionHandler';
import config from '../../config/waterbox/config.waterbox';

const getAllProposals = undefined;

async function getConfigs() {
  const notion = new NotionHandler(config);
  const allProposals = await notion.queryNotionDb(getAllProposals);
  Promise.all(allProposals.map(async (proposal) => {
    notion.updateMetaData(
      proposal.hash,
      {
        [config.notion.propertyKeys.status]: {
          select: { name: 'Discussion' }
        },
        [config.notion.propertyKeys.discussionThread]: { url: null },
        [config.notion.propertyKeys.vote]: { url: null }
      }
    );
  }));
}

getConfigs();

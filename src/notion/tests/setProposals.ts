import { NotionHandler } from '../notionHandler';
import config from '../../config/dev/config.dev';
import { keys } from '../../keys';

const getAllProposals = undefined;

async function getConfigs() {
  const notion = new NotionHandler(keys.NOTION_KEY, config);
  const allProposals = await notion.queryNotionDb(getAllProposals);
  Promise.all(allProposals.map(async (proposal) => {
    notion.updateMetaData(
      proposal.hash,
      {
        [config.notion.propertyKeys.status]: {
          select: { name: 'Discussion' }
        },
        // [config.notion.propertyKeys.discussionThread]: { url: null },
        // [config.notion.propertyKeys.vote]: { url: null }
      }
    );
  }));
}

getConfigs();

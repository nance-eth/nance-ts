import { NotionHandler } from '../notionHandler';
import config from '../../config/dev/config.dev';
import { keys } from '../../keys';

async function main() {
  if (keys.NOTION_KEY) {
    const notion = new NotionHandler(keys.NOTION_KEY, config);
    console.log(await notion.getNextProposalIdNumber());
  }
}

main();

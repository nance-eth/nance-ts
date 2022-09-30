import { NotionHandler } from '../notionHandler';
import config from '../../config/waterbox/config.waterbox';
import { keys } from '../../keys';

async function main() {
  const notion = new NotionHandler(config);
  console.log(await notion.getNextProposalIdNumber());
}

main();

import { getConfig } from '../../configLoader';
import { NotionHandler } from '../notionHandler';

async function main() {
  const config = await getConfig();
  const notion = new NotionHandler(config);
  console.log(await notion.getNextProposalIdNumber());
}

main();

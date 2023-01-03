import { pinProposal } from '../storageHandler';
import { NotionHandler } from '../../notion/notionHandler';
import { getConfig } from '../../configLoader';

async function main() {
  const config = await getConfig();
  const notion = new NotionHandler(config);
  const proposal = await notion.getContentMarkdown('ac8a20dd484948968d37286f31f43a06');
  console.log(await pinProposal(proposal));
}

main();

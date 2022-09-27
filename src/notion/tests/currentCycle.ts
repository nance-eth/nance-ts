import { NotionHandler } from '../notionHandler';
import { getConfig } from '../../configLoader';

async function main() {
  const config = await getConfig();
  const notion = new NotionHandler(config);

  console.log(await notion.getCurrentGovernanceCycle());
}

main();

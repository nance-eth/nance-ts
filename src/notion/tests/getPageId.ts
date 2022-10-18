import { NotionHandler } from '../notionHandler';
import { getConfig } from '../../configLoader';
import logger from '../../logging';

async function main() {
  const config = await getConfig();
  const notion = new NotionHandler(config);
  logger.info(await notion.pageIdToProposal('24a4d31b86c9427493631fb9d8315a98'));
}

main();

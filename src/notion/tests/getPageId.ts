import { NotionHandler } from '../notionHandler';
// import config from '../../config/juicebox/config.juicebox';
import config from '../../config/dev/config.dev';
import logger from '../../logging';

async function main() {
  const notion = new NotionHandler(config);
  logger.info(await notion.pageIdToProposal('24a4d31b86c9427493631fb9d8315a98'));
}

main();

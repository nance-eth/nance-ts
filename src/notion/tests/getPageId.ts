import { NotionHandler } from '../notionHandler';
// import config from '../../config/juicebox/config.juicebox';
import config from '../../config/dev/config.dev';
import { keys } from '../../keys';
import logger from '../../logging';
import { NanceConfig } from '../../types';

async function main() {
  if (keys.NOTION_KEY) {
    const notion = new NotionHandler(keys.NOTION_KEY, config as NanceConfig);
    logger.info(await notion.pageIdToProposal('24a4d31b86c9427493631fb9d8315a98'));
  }
}

main();

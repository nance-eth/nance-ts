import { NotionHandler } from '../notionHandler';
// import config from '../../config/juicebox/config.juicebox';
import config from '../../config/dev/config.dev';
import { keys } from '../../keys';
import logger from '../../logging';
import { NanceConfig } from '../../types';

async function main() {
  if (keys.NOTION_KEY) {
    const notion = new NotionHandler(keys.NOTION_KEY, config as NanceConfig);
    logger.info(await notion.pageIdToProposal('d0d1960fdd9b4969ad5834c9431ff125'));
  }
}

main();

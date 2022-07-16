import { NotionHandler } from '../notionHandler';
import config from '../../config/juicebox/config.juicebox';
import { keys } from '../../keys';

async function main() {
  if (keys.NOTION_KEY) {
    const notion = new NotionHandler(keys.NOTION_KEY, config);
    console.log(await notion.pageIdToProposal('c1b700dc7c294c1aa3a521b556168ea9'));
  }
}

main();

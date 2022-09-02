import { NotionHandler } from '../notionHandler';
import { keys } from '../../keys';
import { getConfig } from '../../configLoader';

async function main() {
  const config = await getConfig();
  const notion = new NotionHandler(keys.NOTION_KEY, config);
  const proposals = await notion.assignProposalIds(await notion.getToDiscuss());
  Promise.all(proposals.map(async (proposal) => {
    notion.updateStatusTemperatureCheckAndProposalId(proposal);
  })).then(() => {
    console.log(proposals);
  });
}

main();

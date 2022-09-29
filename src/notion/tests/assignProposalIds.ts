import { NotionHandler } from '../notionHandler';
import { getConfig } from '../../configLoader';

async function main() {
  const config = await getConfig();
  const notion = new NotionHandler(config);
  const nextId = await notion.getNextProposalIdNumber();
  console.log(nextId);
  // const proposals = await notion.assignProposalIds(await notion.getToDiscuss());
  // Promise.all(proposals.map(async (proposal) => {
  //   notion.updateStatusTemperatureCheckAndProposalId(proposal);
  // })).then(() => {
  //   console.log(proposals);
  // });
}

main();

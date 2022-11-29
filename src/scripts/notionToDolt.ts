import { getConfig } from '../configLoader';
import { DoltHandler } from '../dolt/doltHandler';
import { keys } from '../keys';
import { NotionHandler } from '../notion/notionHandler';

async function main() {
  const config = await getConfig();
  const notion = new NotionHandler(config);
  const dolt = new DoltHandler(config.dolt.owner, config.dolt.repo, keys.DOLT_KEY, config.propertyKeys);
  dolt.currentGovernanceCycle = await notion.getCurrentGovernanceCycle();
  const pageId = 'cb97a668f9b442efa69b1a1a6f736dcb';
  const proposal = await notion.pageIdToProposal(pageId);
  proposal.body = (await notion.getContentMarkdown(proposal.hash)).body;
  dolt.addProposalToDb(proposal).then((res) => {
    console.log(res);
  }).catch((e) => {
    console.error(e);
  });
}

main();
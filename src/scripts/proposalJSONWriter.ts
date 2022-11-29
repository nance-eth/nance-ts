import { getConfig } from '../configLoader';
import { NotionHandler } from '../notion/notionHandler';

async function main() {
  const config = await getConfig();
  const notion = new NotionHandler(config);
  const temperatureCheckProposals = await notion.getDiscussionProposals();
  Promise.all(temperatureCheckProposals.map(async (proposal) => {
    proposal.body = (await notion.getContentMarkdown(proposal.hash)).body;
  })).then(() => {
    console.log(console.log(temperatureCheckProposals));
  });
}

main();
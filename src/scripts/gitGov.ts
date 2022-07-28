import { Nance } from '../nance';
import { NanceExtensions } from '../extensions';
import { getConfig } from '../configLoader';

async function main() {
  const config  = await getConfig();
  const nance = new Nance(config);
  const nanceExt = new NanceExtensions(config);
  
  const discussionProposals = await nance.proposalHandler.getDiscussionProposals();
  console.log(discussionProposals);
}

main();

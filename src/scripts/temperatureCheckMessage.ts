import { getConfig } from '../configLoader';
import { Nance } from '../nance';
import { getLastSlash, sleep } from '../utils';

async function main(){
  const config = await getConfig();
  const nance = new Nance(config);
  const proposals = await nance.dProposalHandler.getDiscussionProposals();
  await sleep(500);
  Promise.all(proposals.map((proposal) => {
    const thread = getLastSlash(proposal.discussionThreadURL);
    nance.dialogHandler.setupPoll(thread);
  }))
}

main();

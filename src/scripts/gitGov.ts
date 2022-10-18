import { Nance } from '../nance';
import { NanceExtensions } from '../extensions';
import { getConfig } from '../configLoader';
import { Proposal } from '../types';

async function main() {
  const config  = await getConfig();
  const nance = new Nance(config);
  const nanceExt = new NanceExtensions(nance);
  
  const proposals = await nance.proposalHandler.getVoteProposals();
  Promise.all(proposals.map(async (proposal: Proposal) => {
    proposal.body = (await nance.proposalHandler.getContentMarkdown(proposal.hash)).body;
    return proposal;
  })).then(async (proposals) => {
    nanceExt.pushNewCycle(proposals);
  });
}

main();

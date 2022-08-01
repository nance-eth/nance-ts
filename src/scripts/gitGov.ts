import { Nance } from '../nance';
import { NanceExtensions } from '../extensions';
import { getConfig } from '../configLoader';
import { Proposal } from '../types';

async function main() {
  const config  = await getConfig();
  const nance = new Nance(config);
  const nanceExt = new NanceExtensions(config);
  
  const proposals = await nance.proposalHandler.getTemperatureCheckProposals();
  Promise.all(proposals.map(async (proposal: Proposal) => {
    proposal.markdown = await nance.proposalHandler.getContentMarkdown(proposal.hash);
    return proposal;
  })).then(async (proposals) => {
    // console.log(proposals);
    nanceExt.pushNewCycle(proposals)
  });
}

main();

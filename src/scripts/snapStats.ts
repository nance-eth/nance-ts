import { getConfig } from '../configLoader';
import { Nance} from '../nance';
import { numToPrettyString, sleep } from '../utils';

async function main() {
  const config = await getConfig();
  const nance = new Nance(config);
  await sleep(500);
  const proposals = await nance.votingHandler.getAllProposalsByScore();
  let proposal: any;
  for (let i = 0; i < proposals.length; i+= 1) {
    proposal = proposals[i];
    await sleep(100);
    try {
      const dProposal = (await nance.dProposalHandler.getProposalByAnyId(proposal.id))[0];
      console.log(`${i} - ${dProposal.title}\nhttps://jbdao.org/p/${dProposal.proposalId} \nParticipants: ${proposal.votes} Total: ${numToPrettyString(proposal.scores_total)} For: ${numToPrettyString(proposal.scores[0])} Against: ${numToPrettyString(proposal.scores[1])}\n=========================`);
    } catch(e) {}
  }
}

main();

import { getConfig } from '../configLoader';
import { Nance } from '../nance';
import { getLastSlash, sleep } from '../utils';

async function main() {
  const config = await getConfig();
  const nance = new Nance(config);
  await sleep(1000);
  const proposals = await nance.proposalHandler.getVoteProposals();
  Promise.all(proposals.map(async (proposal) => { 
    const threadId = getLastSlash(proposal.discussionThreadURL);
    const pollResults = await nance.dialogHandler.getPollVoters(threadId);
    proposal.temperatureCheckVotes = [pollResults.voteYesUsers.length, pollResults.voteNoUsers.length];
    console.log(proposal.title, proposal.temperatureCheckVotes);
    console.log(await nance.dProposalHandler.updateAfterTemperatureCheck(proposal));
  }));
}

main();
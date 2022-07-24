import { getConfig } from '../../configLoader';
import { getLastSlash as getIdFromURL } from '../../utils';
import { GithubProposalHandler } from '../githubProposalHandler';

async function main() {
  const config = await getConfig();
  const proposalHandler = new GithubProposalHandler(config);

  const voteProposals = await proposalHandler.getVoteProposals();
  console.log(voteProposals);
}

main();

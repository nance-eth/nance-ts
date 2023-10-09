import { getSpaceConfig } from '../../api/helpers/getSpace';
import { discordLogin } from '../../api/helpers/discord';
import { Proposal } from '../../types';

const mockProposals = [
  {
    hash: '1',
    title: 'Proposal 1',
    proposalId: 1,
    internalVoteResults: {
      voteProposalId: '1',
      totalVotes: 100,
      scoresTotal: 10000000,
      quorumMet: false,
    },
  },
  {
    hash: '2',
    title: 'Proposal 2',
    proposalId: 2,
    internalVoteResults: {
      voteProposalId: '2',
      totalVotes: 10,
      scoresTotal: 20000000,
      quorumMet: false,
    },
  }
] as Proposal[];

async function main() {
  const { config } = await getSpaceConfig('waterbox');
  const discord = await discordLogin(config);
  discord.sendQuorumRollup(mockProposals, new Date());
}

main();

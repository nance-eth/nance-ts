import { NanceConfig } from '../types';
import { discordLogin } from '../api/helpers/discord';
import { DoltHandler } from '../dolt/doltHandler';
import { pools } from '../dolt/pools';
import { SnapshotHandler } from '../snapshot/snapshotHandler';

export const sendQuorumRollup = async (config: NanceConfig, endDate: Date) => {
  const dolt = new DoltHandler(pools[config.name], config.proposalIdPrefix);
  const proposals = await dolt.getVoteProposals({ uploadedToSnapshot: true });
  const snapshot = new SnapshotHandler('', config); // dont need private key for this call
  const proposalSnapshotIdStrings = proposals.map((proposal) => { return `"${proposal.voteURL}"`; });
  const voteResults = await snapshot.getProposalVotes(proposalSnapshotIdStrings);
  const proposalsUnderQuorum = voteResults.filter((vote) => {
    return vote.scoresTotal < config.snapshot.minTokenPassingAmount;
  }).map((vote) => {
    const findProposal = proposals.find((proposal) => { return proposal.voteURL === vote.voteProposalId; });
    return {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      ...findProposal!,
      internalVoteResults: {
        ...vote,
        quorumMet: false
      },
    };
  });
  // if (proposalsUnderQuorum.length === 0) return;
  // const dialogHandler = await discordLogin(config);
  // dialogHandler.(proposalsUnderQuorum, endDate);
};

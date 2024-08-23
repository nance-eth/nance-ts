import { NanceConfig, VoteResults, Proposal } from '@nance/nance-sdk';
import { pools } from '../../dolt/pools';
import { DoltHandler } from '../../dolt/doltHandler';
import { SnapshotHandler } from '../../snapshot/snapshotHandler';

export const getVotePercentages = (config: NanceConfig, voteResults: VoteResults) => {
  const yes = voteResults.scores[0];
  const no = voteResults.scores[1];
  const percentageYes = yes / (yes + no);
  const percentageNo = no / (yes + no);
  return {
    [config.snapshot.choices[0]]: (Number.isNaN(percentageYes) ? 0 : percentageYes),
    [config.snapshot.choices[1]]: (Number.isNaN(percentageNo) ? 0 : percentageNo),
  };
};

export const votePassCheck = (config: NanceConfig, voteResults: VoteResults) => {
  if (!voteResults.scoresTotal) return false;
  return (
    voteResults.scoresTotal >= config.snapshot.minTokenPassingAmount
    && getVotePercentages(config, voteResults)[config.snapshot.choices[0]] >= config.snapshot.passingRatio
  );
};

export const quorumMet = (scoresTotal: number, quorum: number): boolean => {
  return scoresTotal >= quorum;
};

export const getProposalsWithVotes = async (config: NanceConfig, _proposals?: Proposal[]): Promise<Proposal[]> => {
  const dolt = new DoltHandler(pools[config.name], config.proposalIdPrefix);
  const { proposals } = await dolt.getProposals({ status: ['Voting'] });
  const snapshot = new SnapshotHandler('', config); // dont need private key for this call
  const proposalSnapshotIdStrings = proposals.map((proposal) => { return `"${proposal.voteURL}"`; });
  const voteResults = await snapshot.getProposalVotes(proposalSnapshotIdStrings);
  const proposalsWithVotes = proposals.map((proposal) => {
    const voteResult = voteResults.find((result) => { return result.id === proposal.voteURL; });
    if (!voteResult) return proposal;
    return {
      ...proposal,
      voteResults: {
        choices: voteResult.choices,
        scores: voteResult.scores,
        votes: voteResult.votes,
        scoresState: voteResult.scores_state,
        scoresTotal: voteResult.scores_total,
        quorumMet: quorumMet(voteResult.scores_total, config.snapshot.minTokenPassingAmount),
      },
    };
  });
  return proposalsWithVotes;
};

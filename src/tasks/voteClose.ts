import { SnapshotHandler } from '../snapshot/snapshotHandler';
import { DoltHandler } from '../dolt/doltHandler';
import { pools } from '../dolt/pools';
import { NanceConfig, InternalVoteResults, Proposal } from '../types';
import { EMOJI, STATUS } from '../constants';
import logger from '../logging';

const votePassCheck = (config: NanceConfig, voteResults: InternalVoteResults) => {
  const yes = voteResults.scores[config.snapshot.choices[0]];
  return (
    yes >= config.snapshot.minTokenPassingAmount
    && voteResults.percentages[config.snapshot.choices[0]] >= config.snapshot.passingRatio
  );
};

const getVotePercentages = (config: NanceConfig, voteResults: InternalVoteResults) => {
  const yes = voteResults.scores[config.snapshot.choices[0]];
  const no = voteResults.scores[config.snapshot.choices[1]];
  const percentageYes = yes / (yes + no);
  const percentageNo = no / (yes + no);
  return {
    [config.snapshot.choices[0]]: (Number.isNaN(percentageYes) ? 0 : percentageYes),
    [config.snapshot.choices[1]]: (Number.isNaN(percentageNo) ? 0 : percentageNo),
  };
};

export const voteClose = async (config: NanceConfig) => {
  try {
    const dolt = new DoltHandler(pools[config.name], config.proposalIdPrefix);
    const proposals = await dolt.getVoteProposals({ uploadedToSnapshot: true });
    if (proposals.length === 0) return [];
    const proposalSnapshotIdStrings = proposals.map((proposal) => { return `"${proposal.voteURL}"`; });
    const snapshot = new SnapshotHandler('', config); // dont need private key for this call
    const voteResults = await snapshot.getProposalVotes(proposalSnapshotIdStrings);
    const proposalsWithResults = await Promise.all(voteResults.map(async (vote) => {
      const findProposal = proposals.find((proposal) => { return proposal.voteURL === vote.voteProposalId; });
      if (!findProposal) { return {} as Proposal; }
      const pass = (votePassCheck(config, vote));
      const outcomeStatus = pass ? STATUS.APPROVED : STATUS.CANCELLED;
      const outcomeEmojikey = pass ? 'APPROVED' : 'CANCELLED' as keyof typeof EMOJI;
      const updatedProposal = {
        ...findProposal,
        status: outcomeStatus,
        internalVoteResults: {
          ...vote,
          outcomePercentages: getVotePercentages(config, vote),
          outcomeEmoji: EMOJI[outcomeEmojikey],
        },
      };
      await dolt.updateVotingClose(updatedProposal);
      return updatedProposal as Proposal;
    })).catch((e) => { return Promise.reject(e); });
    return proposalsWithResults;
  } catch (e) {
    logger.error(`error closing vote for ${config.name}`);
    logger.error(e);
    return Promise.reject(e);
  }
};

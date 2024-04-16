import { NanceConfig, Proposal, ProposalStatus } from '@nance/nance-sdk';
import { DoltHandler } from '../dolt/doltHandler';
import { pools } from '../dolt/pools';
import logger from '../logging';
import { getProposalsWithVotes, votePassCheck } from './helpers/voting';

export const voteClose = async (space: string, config: NanceConfig, _proposals?: Proposal[], dryrun = false) => {
  try {
    const dolt = new DoltHandler(pools[space], config.proposalIdPrefix);
    const proposals = _proposals || await getProposalsWithVotes(config);
    if (proposals.length === 0) return [];
    const updatedProposals = await Promise.all(proposals.map(async (proposal) => {
      if (!proposal.voteResults) return proposal;
      const pass = (votePassCheck(config, proposal.voteResults));
      const outcomeStatus = pass ? "Approved" : "Cancelled" as ProposalStatus;
      const updatedProposal = { ...proposal, status: outcomeStatus };
      if (!dryrun) await dolt.updateVotingClose(updatedProposal);
      return updatedProposal;
    })).catch((e) => { return Promise.reject(e); });
    return updatedProposals;
  } catch (e) {
    logger.error(`error closing vote for ${space}`);
    logger.error(e);
    return Promise.reject(e);
  }
};

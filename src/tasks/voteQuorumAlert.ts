import { NanceConfig, Proposal } from '../types';
import { discordLogin } from '../api/helpers/discord';
import { doltSys } from '../dolt/doltSys';
import { TASKS } from '../constants';
import { DialogHandlerMessageIds } from '../dolt/schema';
import { getProposalsWithVotes } from './helpers/voting';
import logger from '../logging';

export const voteQuorumAlert = async (config: NanceConfig, endDate: Date, _proposals?: Proposal[]) => {
  try {
    const proposals = _proposals || await getProposalsWithVotes(config);
    const proposalsUnderQuorum = proposals.filter((proposal) => { return !proposal.voteResults?.quoromMet; });
    if (proposalsUnderQuorum.length === 0) return;
    const dialogHandler = await discordLogin(config);
    const voteQuorumAlertMessageId = await dialogHandler.sendQuorumRollup(proposalsUnderQuorum, endDate);
    await doltSys.updateDialogHandlerMessageId(config.name, TASKS.voteQuorumAlert as keyof DialogHandlerMessageIds, voteQuorumAlertMessageId);
  } catch (e) {
    logger.error(`error sending vote quorum alert for ${config.name}`);
    logger.error(e);
  }
};

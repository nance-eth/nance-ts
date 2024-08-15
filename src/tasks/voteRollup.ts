import { NanceConfig, Proposal, DialogHandlerMessageIds } from '@nance/nance-sdk';
import { discordLogin } from '../api/helpers/discord';
import { DoltHandler } from '../dolt/doltHandler';
import { pools } from '../dolt/pools';
import { doltSys } from '../dolt/doltSys';
import { TASKS } from '../constants';
import logger from '../logging';

export const voteRollup = async (space: string, config: NanceConfig, endDate: Date, _proposals?: Proposal[]) => {
  try {
    let proposals = _proposals;
    if (!proposals) {
      const dolt = new DoltHandler(pools[space], config.proposalIdPrefix);
      proposals = await dolt.getProposals({ status: ["Voting"] }).then((res) => res.proposals);
    }
    const dialogHandler = await discordLogin(config);
    if (!proposals || proposals.length === 0) return;
    const votingRollup = await dialogHandler.sendVoteRollup(
      proposals,
      endDate,
    );
    await doltSys.updateDialogHandlerMessageId(space, TASKS.voteRollup as keyof DialogHandlerMessageIds, votingRollup);
    dialogHandler.logout();
  } catch (e) {
    logger.error(`error rolling up vote for ${space}`);
    logger.error(e);
  }
};

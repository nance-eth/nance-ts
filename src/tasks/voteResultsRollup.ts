import { discordLogin } from '../api/helpers/discord';
import { doltSys } from '../dolt/doltSys';
import { Proposal, NanceConfig } from '../types';
import { TASKS } from '../constants';
import { DialogHandlerMessageIds } from '../dolt/schema';

export const voteResultsRollup = async (space: string, config: NanceConfig, proposals: Proposal[]) => {
  try {
    if (proposals.length === 0) return;
    const discord = await discordLogin(config);
    const voteResultsRollUpMessageId = await discord.sendVoteResultsRollup(proposals);
    await doltSys.updateDialogHandlerMessageId(space, TASKS.voteResultsRollup as keyof DialogHandlerMessageIds, voteResultsRollUpMessageId);
  } catch (e) {
    console.error(`error rolling up vote results for ${space}`);
    console.error(e);
  }
};

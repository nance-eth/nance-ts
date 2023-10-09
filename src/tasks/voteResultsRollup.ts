import { discordLogin } from '../api/helpers/discord';
import { doltSys } from '../dolt/doltSys';
import { Proposal, NanceConfig } from '../types';
import { TASKS } from '../constants';
import { DialogHandlerMessageIds } from '../dolt/schema';

export const voteResultsRollup = async (config: NanceConfig, proposals: Proposal[]) => {
  try {
    const discord = await discordLogin(config);
    const voteResultsRollUpMessageId = await discord.sendVoteResultsRollup(proposals);
    await doltSys.updateDialogHandlerMessageId(config.name, TASKS.voteResultsRollup as keyof DialogHandlerMessageIds, voteResultsRollUpMessageId);
  } catch (e) {
    console.error(`error rolling up vote results for ${config.name}`);
    console.error(e);
  }
};

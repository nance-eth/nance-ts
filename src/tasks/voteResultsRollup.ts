import { Proposal, NanceConfig, DialogHandlerMessageIds } from "@nance/nance-sdk";
import { discordLogin } from "../api/helpers/discord";
import { getSysDb } from "@/dolt/pools";
import { TASKS } from "../constants";

export const voteResultsRollup = async (space: string, config: NanceConfig, proposals: Proposal[]) => {
  try {
    const doltSys = getSysDb();
    if (proposals.length === 0) return;
    const discord = await discordLogin(config);
    const voteResultsRollUpMessageId = await discord.sendVoteResultsRollup(proposals);
    await doltSys.updateDialogHandlerMessageId(space, TASKS.voteResultsRollup as keyof DialogHandlerMessageIds, voteResultsRollUpMessageId);
  } catch (e) {
    console.error(`error rolling up vote results for ${space}`);
    console.error(e);
  }
};

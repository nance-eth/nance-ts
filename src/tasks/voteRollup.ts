import { NanceConfig, Proposal, DialogHandlerMessageIds } from "@nance/nance-sdk";
import { discordLogin } from "../api/helpers/discord";
import { getDb, getSysDb } from "../dolt/pools";
import { TASKS } from "../constants";
import logger from "../logging";

export const voteRollup = async (space: string, config: NanceConfig, endDate: Date, _proposals?: Proposal[]) => {
  try {
    let proposals = _proposals;
    if (!proposals) {
      const dolt = getDb(space);
      proposals = await dolt.getProposals({ status: ["Voting"] }).then((res) => res.proposals);
    }
    const dialogHandler = await discordLogin(config);
    if (!proposals || proposals.length === 0) return;
    const votingRollup = await dialogHandler.sendVoteRollup(
      proposals,
      endDate,
    );
    await getSysDb().updateDialogHandlerMessageId(space, TASKS.voteRollup as keyof DialogHandlerMessageIds, votingRollup);
    dialogHandler.logout();
  } catch (e) {
    logger.error(`error rolling up vote for ${space}`);
    logger.error(e);
  }
};

import { NanceConfig, ProposalStatus } from '@nance/nance-sdk';
import { discordLogin } from '../api/helpers/discord';
import { DoltHandler } from '../dolt/doltHandler';
import { pools } from '../dolt/pools';
import { getLastSlash } from '../utils';
import logger from '../logging';

const pollPassCheck = (config: NanceConfig, yesCount: number, noCount: number) => {
  const ratio = yesCount / (yesCount + noCount);
  if (yesCount >= config.discord.poll.minYesVotes
    && ratio >= config.discord.poll.yesNoRatio) {
    return true;
  }
  return false;
};

export const temperatureCheckClose = async (space: string, config: NanceConfig) => {
  try {
    const dolt = new DoltHandler(pools[space], config.proposalIdPrefix);
    const dialogHandler = await discordLogin(config);
    const { proposals } = await dolt.getProposals({ status: ["Temperature Check"] });
    if (proposals.length === 0) return;
    await Promise.all(proposals.map(async (proposal) => {
      const threadId = getLastSlash(proposal.discussionThreadURL);
      let pollResults;
      let blind = false;
      try {
        pollResults = await dialogHandler.getPollVoters(threadId);
      } catch {
        pollResults = await dolt.getPollsByProposalUuid(proposal.uuid);
        blind = true;
      }
      if (!pollResults) return;
      const yes = pollResults.voteYesUsers.length;
      const no = pollResults.voteNoUsers.length;
      const pass = pollPassCheck(config, yes, no);
      const status: ProposalStatus = (pass) ? "Voting" : "Cancelled";
      if (blind) await dialogHandler.sendBlindPollResults(threadId, yes, no, pass);
      if (!blind) {
        await dialogHandler.sendPollResults(pollResults, pass, threadId);
        await dialogHandler.sendPollResultsEmoji(pass, threadId);
      }
      const updatedProposal = { ...proposal, status, temperatureCheckVotes: [yes, no] };
      await dolt.updateTemperatureCheckClose(updatedProposal);
    })).catch((e) => {
      return Promise.reject(e);
    });
  } catch (e) {
    logger.error(`error closing temperatureCheck for ${space}`);
    logger.error(e);
  }
};

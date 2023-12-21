import { NanceConfig } from '../types';
import { discordLogin } from '../api/helpers/discord';
import { DoltHandler } from '../dolt/doltHandler';
import { pools } from '../dolt/pools';
import { getLastSlash } from '../utils';
import { STATUS } from '../constants';
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
    const temperatureCheckProposals = await dolt.getTemperatureCheckProposals();
    if (temperatureCheckProposals.length === 0) return;
    await Promise.all(temperatureCheckProposals.map(async (proposal) => {
      const threadId = getLastSlash(proposal.discussionThreadURL);
      const pollResults = await dialogHandler.getPollVoters(threadId);
      const temperatureCheckVotes = [pollResults.voteYesUsers.length, pollResults.voteNoUsers.length];
      const pass = pollPassCheck(
        config,
        pollResults.voteYesUsers.length,
        pollResults.voteNoUsers.length
      );
      const status = (pass) ? STATUS.VOTING : STATUS.CANCELLED;
      await dialogHandler.sendPollResults(pollResults, pass, threadId);
      await dialogHandler.sendPollResultsEmoji(pass, threadId);
      const updatedProposal = { ...proposal, status, temperatureCheckVotes };
      await dolt.updateTemperatureCheckClose(updatedProposal);
    })).catch((e) => {
      return Promise.reject(e);
    });
  } catch (e) {
    logger.error(`error closing temperatureCheck for ${space}`);
    logger.error(e);
  }
};

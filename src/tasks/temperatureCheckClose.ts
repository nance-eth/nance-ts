import { NanceConfig, PollResults, ProposalStatus } from '@nance/nance-sdk';
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
    const temperatureCheckProposals = await dolt.getTemperatureCheckProposals();
    if (temperatureCheckProposals.length === 0) return;
    await Promise.all(temperatureCheckProposals.map(async (proposal) => {
      const threadId = getLastSlash(proposal.discussionThreadURL);
      // assume blind poll first
      let pollResults;
      let blind = true;
      pollResults = await dolt.getPollsByProposalUuid(proposal.uuid);
      if (!pollResults) {
        pollResults = await dialogHandler.getPollVoters(threadId);
        blind = false;
      }
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

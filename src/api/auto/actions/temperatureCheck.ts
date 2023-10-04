import { discordLogin } from '../../helpers/discord';
import { SpaceInfo } from '../../models';
import { EVENTS } from '../../../constants';
import { DoltSysHandler } from '../../../dolt/doltSysHandler';
import { DoltHandler } from '../../../dolt/doltHandler';
import { pools } from '../../../dolt/pools';
import { getLastSlash } from '../../../utils';
import logger from '../../../logging';
import { NanceConfig } from '../../../types';

const doltSys = new DoltSysHandler(pools.nance_sys);

const pollPassCheck = (space: SpaceInfo, yesCount: number, noCount: number) => {
  const ratio = yesCount / (yesCount + noCount);
  if (yesCount >= space.config.discord.poll.minYesVotes
    && ratio >= space.config.discord.poll.yesNoRatio) {
    return true;
  }
  return false;
};

export const sendTemperatureCheckStartAlert = async (config: NanceConfig, date: Date) => {
  const dialogHandler = await discordLogin(config);
  const temperatureCheckStartReminder = await dialogHandler.sendReminder(
    EVENTS.TEMPERATURE_CHECK,
    date,
    'start'
  );
  await doltSys.updateDialogHandlerMessageId(
    config.name,
    'temperatureCheckStartAlert',
    temperatureCheckStartReminder
  );
  dialogHandler.logout();
  return true;
};

export const deleteTemperatureCheckStartAlert = async (config: NanceConfig, messageId: string) => {
  const dialogHandler = await discordLogin(config);
  await dialogHandler.deleteMessage(messageId);
  await doltSys.updateDialogHandlerMessageId(config.name, 'temperatureCheckStartAlert', '');
  dialogHandler.logout();
  return true;
};

export const sendTemperatureCheckRollup = async (config: NanceConfig, date: Date) => {
  const dialogHandler = await discordLogin(config);
  const dolt = new DoltHandler(pools[config.name], config.propertyKeys);
  const proposals = await dolt.getDiscussionProposals();
  const temperatureCheckRollup = await dialogHandler.sendTemperatureCheckRollup(
    proposals,
    date,
  );
  // TODO: update status of proposals to temperatureCheck
  await doltSys.updateDialogHandlerMessageId(config.name, 'temperatureCheckRollup', temperatureCheckRollup);
  dialogHandler.logout();
  return true;
};

export const sendTemperatureCheckEndAlert = async (space: SpaceInfo) => {
  const dialogHandler = await discordLogin(space.config);
  const temperatureCheckEndReminder = await dialogHandler.sendReminder(
    EVENTS.TEMPERATURE_CHECK,
    space.currentEvent.end,
    'end'
  );
  await doltSys.updateDialogHandlerMessageId(
    space.name,
    'temperatureCheckEndAlert',
    temperatureCheckEndReminder
  );
  dialogHandler.logout();
  return true;
};

export const temperatureCheckClose = async (space: SpaceInfo) => {
  const dolt = new DoltHandler(pools[space.name], space.config.propertyKeys);
  const dialogHandler = await discordLogin(space.config);
  const temperatureCheckProposals = await dolt.getTemperatureCheckProposals();
  await Promise.all(temperatureCheckProposals.map(async (proposal) => {
    const threadId = getLastSlash(proposal.discussionThreadURL);
    const pollResults = await dialogHandler.getPollVoters(threadId);
    const temperatureCheckVotes = [pollResults.voteYesUsers.length, pollResults.voteNoUsers.length];
    const pass = pollPassCheck(
      space,
      pollResults.voteYesUsers.length,
      pollResults.voteNoUsers.length
    );
    const status = (pass) ? space.config.propertyKeys.statusVoting : space.config.propertyKeys.statusCancelled;
    if (space.config.discord.poll.showResults) {
      dialogHandler.sendPollResults(pollResults, pass, threadId);
    }
    dialogHandler.sendPollResultsEmoji(pass, threadId);
    const updatedProposal = { ...proposal, status, temperatureCheckVotes };
    try { await dolt.updateTemperatureCheckClose(updatedProposal); } catch (e) { logger.error(`${space.name}: ${e}`); }
  })).then(() => {
    return true;
  }).catch((e) => {
    logger.error(`${space.name}: ${e}`);
    return false;
  });
};

export const deleteTemperatureCheckEndAlert = async (space: SpaceInfo) => {
  const dialogHandler = await discordLogin(space.config);
  await dialogHandler.deleteMessage(space.dialog.temperatureCheckEndAlert);
  await doltSys.updateDialogHandlerMessageId(space.name, 'temperatureCheckEndAlert', '');
  dialogHandler.logout();
  return true;
};

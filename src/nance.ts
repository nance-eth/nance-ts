import { DiscordHandler } from './discord/discordHandler';
import { NotionHandler } from './notion/notionHandler';
import { keys, configName } from './keys';
import config from './config/config.dev';
import { CalendarHandler } from './calendar/CalendarHandler';
import {
  log,
  sleep,
  getLastSlash,
  addDaysToDate
} from './utils';
import { Proposal } from './types';

const proposalHandler = new NotionHandler(keys.NOTION_KEY, config);
const dialogHandler = new DiscordHandler(keys.DISCORD_KEY, config);

async function queryAndSendDiscussions() {
  try {
    const proposalsToDiscuss = await proposalHandler.getToDiscuss();
    proposalsToDiscuss.forEach(async (proposal: Proposal) => {
      const threadURL = await dialogHandler.startDiscussion(proposal);
      await proposalHandler.updateMetaData(
        proposal.hash,
        { [config.discussionThreadPropertyKey]: { url: threadURL } }
      );
    });
  } catch (e) {
    log(`${config.name}: queryAndSendDiscussions() issue`, 'error');
  }
}

async function temperatureCheckSetup() {
  try {
    const proposalsToTemperatureCheck = await proposalHandler.getToTemperatureCheck();
    proposalsToTemperatureCheck.forEach(async (proposal: Proposal) => {
      const threadId = getLastSlash(proposal.discussionThreadURL);
      await dialogHandler.setupPoll(threadId);
    });
    await dialogHandler.sendTemperatureCheckRollup(
      proposalsToTemperatureCheck,
      addDaysToDate(new Date(), config.poll.votingTimeDays)
    );
    log(`${config.name}: temperatureCheckSetup() complete`, 'good');
  } catch (e) {
    log(`${config.name}: temperatureCheckSetup() issue`, 'error');
  }
}

async function temperatureCheckClose() {
  try {
    const proposalsToCloseTemperatureCheck = await proposalHandler.getToCloseTemperatureCheck();
  } catch (e) {
    log(`${config.name}: temperatureCheckClose() issue`, 'error');
  }
}

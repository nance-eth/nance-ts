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

const ICS_FILE = './src/config/juicebox.ics';

const notion = new NotionHandler(keys.NOTION_KEY, config);
const discord = new DiscordHandler(keys.DISCORD_KEY, config);
const calendar = new CalendarHandler(ICS_FILE);

async function queryAndSendDiscussions() {
  try {
    const proposalsToDiscuss = await notion.getToDiscuss();
    proposalsToDiscuss.forEach(async (proposal: Proposal) => {
      const threadURL = await discord.startDiscussion(proposal);
      await notion.updateMetaData(
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
    const proposalsToTemperatureCheck = await notion.getToTemperatureCheck();
    proposalsToTemperatureCheck.forEach(async (proposal: any) => {
      const threadId = getLastSlash(proposal.discussionThreadURL);
      await discord.setupPoll(threadId);
    });
    await discord.sendTemperatureCheckRollup(
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
    const proposalsToCloseTemperatureCheck = await notion.getToCloseTemperatureCheck();
  } catch (e) {
    log(`${config.name}: temperatureCheckClose() issue`, 'error');
  }
}

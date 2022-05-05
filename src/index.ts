import { DiscordHandler } from './discord/discordHandler';
import { NotionHandler } from './notion/notionHandler';
import { keys, configName } from './keys';
import config from './config/config.dev';
import { CalendarHandler } from './calendar/CalendarHandler';
import { sleep, getLastSlash, addDaysToDate } from './utils';
import * as notionUtils from './notion/notionUtils';

const ICS_FILE = './src/config/juicebox.ics';

const notion = new NotionHandler(keys.NOTION_KEY, config.database_id, config.filters);
const discord = new DiscordHandler(keys.DISCORD_KEY, config);
const calendar = new CalendarHandler(ICS_FILE);

async function queryAndSendDiscussions() {
  const proposalsToDiscuss = await notion.getToDiscuss();
  proposalsToDiscuss.forEach(async (proposal) => {
    const threadURL = await discord.startDiscussion({
      title: notionUtils.getTitle(proposal),
      category: notionUtils.getCategory(proposal),
      url: notionUtils.getURL(proposal)
    });
    await notion.updateMetaData(proposal.id, { [config.discussionThreadKey]: { url: threadURL } });
  });
}

async function temperatureCheckSetup() {
  const proposalsToTemperatureCheck = await notion.getToTemperatureCheck();
  proposalsToTemperatureCheck.forEach(async (proposal: any) => {
    const threadId = getLastSlash(proposal.properties[config.discussionThreadKey].url);
    await discord.setupPoll(threadId);
  });
  await discord.sendTemperatureCheckRollup(
    proposalsToTemperatureCheck,
    addDaysToDate(new Date(), 3)
  );
}

sleep(2000).then(() => {
  temperatureCheckSetup();
});

import { DiscordHandler } from './discord/discordHandler';
import { NotionHandler } from './notion/notionHandler';
import { keys, configName } from './keys';
import config from './config/config.dev';
import { CalendarHandler } from './calendar/CalendarHandler';
import { sleep, getLastSlash, addDaysToDate } from './utils';

const ICS_FILE = './src/config/juicebox.ics';

const notion = new NotionHandler(keys.NOTION_KEY, config);
const discord = new DiscordHandler(keys.DISCORD_KEY, config);
const calendar = new CalendarHandler(ICS_FILE);

async function queryAndSendDiscussions() {
  const proposalsToDiscuss = await notion.getToDiscuss();
  proposalsToDiscuss.forEach(async (proposal) => {
    const threadURL = await discord.startDiscussion(proposal);
    await notion.updateMetaData(
      proposal.hash,
      { [config.discussionThreadPropertyKey]: { url: threadURL } }
    );
  });
}

async function temperatureCheckSetup() {
  const proposalsToTemperatureCheck = await notion.getToTemperatureCheck();
  proposalsToTemperatureCheck.forEach(async (proposal: any) => {
    const threadId = getLastSlash(proposal.discussionThreadURL);
    await discord.setupPoll(threadId);
  });
  await discord.sendTemperatureCheckRollup(
    proposalsToTemperatureCheck,
    addDaysToDate(new Date(), config.poll.votingTimeDays)
  );
}

sleep(3000).then(() => {
  temperatureCheckSetup();
});

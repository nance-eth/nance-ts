import { getSpaceInfo } from '../api/helpers/getSpace';
import { discordLogin } from '../api/helpers/discord';

async function main() {
  const { config, currentCycle, currentDay, currentEvent } = await getSpaceInfo(process.env.CONFIG || '');
  const discord = await discordLogin(config);
  console.log(config.discord.reminder.channelIds.map((c) => {
    console.log(c);
  }));
  discord.sendDailyReminder(currentDay, currentCycle, currentEvent.title, currentEvent.end);
} 

main();
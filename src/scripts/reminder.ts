import { DiscordHandler } from '../discord/discordHandler';
import { keys } from '../keys';
import { getConfig } from '../configLoader';
import { sleep, addSecondsToDate } from '../utils';
import { Nance } from '../nance';

async function sendReminder() {
  const config = await getConfig();
  const dialogHandler = new DiscordHandler(keys.DISCORD_KEY, config);
  await sleep(1000);
  dialogHandler.sendReminder('Temperature Check', addSecondsToDate(new Date(), 6), 'end', '', 6 );
}

sendReminder();

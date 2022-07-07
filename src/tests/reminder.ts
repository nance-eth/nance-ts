import { DiscordHandler } from '../discord/discordHandler';
import { keys } from '../keys';
import { getConfig } from '../configLoader';
import { sleep, addSecondsToDate } from '../utils';
import { Nance } from '../nance';

async function sendReminder() {
  const config = await getConfig();
  const nance = new Nance(config);
  await sleep(1000);
  nance.reminder('Snapshot Vote', addSecondsToDate(new Date(), -60 * 60));
}

sendReminder();

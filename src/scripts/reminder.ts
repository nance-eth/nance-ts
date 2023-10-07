import { DiscordHandler } from '../discord/discordHandler';
import { sleep } from '../utils';
import { getSpaceInfo } from '../api/helpers/getSpace';
import { EVENTS } from '../constants';

async function sendReminder() {
  const spaceInfo = await getSpaceInfo('juicebox');
  const dialogHandler = new DiscordHandler(spaceInfo.config);
  await sleep(3000);
  console.log(spaceInfo.currentEvent.end);
  dialogHandler.sendReminder(EVENTS.TEMPERATURE_CHECK, spaceInfo.currentEvent.end, 'start', );
}

sendReminder();

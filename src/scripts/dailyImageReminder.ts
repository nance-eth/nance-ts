import { Nance } from '../nance';
import { doltConfig } from '../configLoader';
import { sleep } from '../utils';
import { getSpaceInfo } from '../api/helpers/getSpaceInfo';

async function main() {
  const { config, currentCycle, currentDay, currentEvent } = await getSpaceInfo(process.env.CONFIG || '');
  const nance = new Nance(config);
  await sleep(3000);
  console.log(config.discord.reminder.channelIds.map((c) => {
    console.log(c);
  }));
  nance.dialogHandler.sendImageReminder(currentDay, currentCycle, currentEvent.title, currentEvent.end);
} 

main();
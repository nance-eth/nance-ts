import { Nance } from '../nance';
import { getConfig } from '../configLoader';
import { downloadImages, sleep } from '../utils';

async function main() {
  const config = await getConfig();
  const nance = new Nance(config);
  await sleep(3000);
  console.log(config.discord.reminder.channelIds.map((c) => {
    console.log(c);
  }));
  const currentGovernanceCycle = (await nance.proposalHandler.getCurrentGovernanceCycle()).toString();
  nance.dialogHandler.sendImageReminder('4', currentGovernanceCycle, 'vote');
} 

main();
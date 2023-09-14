import { Nance } from '../nance';
import { doltConfig } from '../configLoader';
import { sleep } from '../utils';

async function main() {
  const { config } = await doltConfig(process.env.CONFIG || '');
  const nance = new Nance(config);
  await sleep(3000);
  console.log(config.discord.reminder.channelIds.map((c) => {
    console.log(c);
  }));
  const currentGovernanceCycle = await nance.dProposalHandler.getCurrentGovernanceCycle();
  nance.dialogHandler.sendImageReminder(6, currentGovernanceCycle, 'vote');
} 

main();
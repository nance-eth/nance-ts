import { Nance } from '../nance';
import { getConfig } from '../configLoader';
import { downloadImages, sleep } from '../utils';

async function main() {
  const config = await getConfig();
  await downloadImages(config.reminder.imagesCID, config.reminder.images);
  const nance = new Nance(config);
  await sleep(3000);
  console.log(config.reminder.channelIds.map((c) => {
    console.log(c);
  }));
  nance.dialogHandler.sendImageReminder('14', '39', 'delay');
} 

main();
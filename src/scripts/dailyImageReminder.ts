import { Nance } from '../nance';
import { getConfig } from '../configLoader';
import { downloadImages, sleep } from '../utils';

async function download() {
  const images = ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13"];
  const res = await downloadImages('https://nance.mypinata.cloud/ipfs/QmWfKSTSGFQN7qwc2e9vwYro1nJ3XhmqLkUjn3M5MbEoPA', images);
  return;
}

async function main() {
  const config = await getConfig();
  const nance = new Nance(config);
  await sleep(1000);
  console.log(config.reminder.channelIds.map((c) => {
    console.log(c);
  }));
  nance.dialogHandler.sendImageReminder('06', '36', 'vote');
} 

download().then(() => {
  main();
});
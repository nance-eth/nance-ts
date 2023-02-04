import {
  sleep
} from '../utils';
import { Nance } from '../nance';
import { getConfig } from '../configLoader';

async function getConfigs() {
  const config = await getConfig();
  const nance = new Nance(config);
  await sleep(2000);
  console.log(await nance.dProposalHandler.setStalePayouts());
}

getConfigs();

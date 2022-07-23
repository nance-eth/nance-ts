import {
  sleep
} from '../utils';
import { Nance } from '../nance';
import { getConfig } from '../configLoader';

async function getConfigs() {
  const config = await getConfig();
  const nance = new Nance(config);
  await sleep(2000);
  nance.votingClose();
}

getConfigs();

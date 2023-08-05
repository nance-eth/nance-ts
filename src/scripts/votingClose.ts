import {
  sleep
} from '../utils';
import { Nance } from '../nance';
import { doltConfig } from '../configLoader';

async function getConfigs() {
  const { config } = await doltConfig(process.env.CONFIG || '');
  const nance = new Nance(config);
  await sleep(2000);
  nance.votingClose();
}

getConfigs();

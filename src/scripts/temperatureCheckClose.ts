import { sleep } from '../utils';
import { doltConfig } from '../configLoader';
import { Nance } from '../nance';

async function getConfigs() {
  const { config } = await doltConfig(process.env.CONFIG || '');
  const nance = new Nance(config);
  await sleep(1000);
  nance.temperatureCheckClose();
}

getConfigs();

import { sleep } from '../utils';
import { getConfig } from '../configLoader';
import { Nance } from '../nance';

async function getConfigs() {
  const config = await getConfig();
  const nance = new Nance(config);
  await sleep(1000);
  nance.temperatureCheckClose();
}

getConfigs();

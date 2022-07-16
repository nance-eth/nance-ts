import {
  sleep
} from '../utils';
import { Nance } from '../nance';
import { getConfig } from '../configLoader';

let config: any;

async function main() {
  config = await getConfig();
  const nance = new Nance(config);
  await sleep(2000);
  const temperatureCheckProposals = await nance.proposalHandler.getTemperatureCheckProposals();
  nance.translateProposals(temperatureCheckProposals);
}

main();

import {
  sleep
} from '../utils';
import { Nance } from '../nance';
import { getConfig } from '../configLoader';

let config: any;
const pageId = 'c1b700dc7c294c1aa3a521b556168ea9';

async function main() {
  config = await getConfig();
  const nance = new Nance(config);
  await sleep(2000);
  // const temperatureCheckProposals = await nance.proposalHandler.getTemperatureCheckProposals();
  const proposal = await nance.proposalHandler.pageIdToProposal(pageId);
  nance.translateProposals([proposal]);
}

main();

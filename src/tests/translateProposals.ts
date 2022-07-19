import {
  sleep
} from '../utils';
import { Translate } from '../translate';
import { getConfig } from '../configLoader';

let config: any;
const pageId = '4adac5333e3b43e5ad8c95d667909225';

async function main() {
  config = await getConfig();
  const nance = new Translate(config);
  await sleep(2000);
  // const temperatureCheckProposals = await nance.proposalHandler.getTemperatureCheckProposals();
  const proposal = await nance.proposalHandler.pageIdToProposal(pageId);
  nance.translateAndStoreProposals([proposal]);
}

main();

import {
  sleep
} from '../utils';
import { NanceExtensions } from '../extensions';
import { getConfig } from '../configLoader';
import { Nance } from '../nance';

let config: any;
const pageId = '4adac5333e3b43e5ad8c95d667909225';

async function main() {
  config = await getConfig();
  const nanceExt = new NanceExtensions(config);
  const nance = new Nance(config);
  await sleep(2000);
  const temperatureCheckProposals = nance.proposalHandler.getTemperatureCheckProposals().then(async (proposals) => {
    proposals.map(async (proposal) => {
      proposal.markdown = await nance.proposalHandler.getContentMarkdown(proposal.hash);
    })
    return proposals;
  });
  
  // nanceExt.translateAndStoreProposals(await temperatureCheckProposals);
}

main();

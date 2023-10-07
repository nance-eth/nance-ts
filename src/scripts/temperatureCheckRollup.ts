import { sleep } from '../utils';
import { Nance } from '../nance';
import logger from '../logging';
import { getSpaceInfo } from '../api/helpers/getSpace';

async function main() {
  const { config, currentEvent } = await getSpaceInfo(process.env.CONFIG || 'nance');
  const nance = new Nance(config);
  const proposals = await nance.dProposalHandler.getTemperatureCheckProposals();
  console.log(proposals.length);
  nance.dialogHandler.sendTemperatureCheckRollup(proposals, currentEvent.end);
}

main();

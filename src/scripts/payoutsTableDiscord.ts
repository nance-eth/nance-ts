import { getConfig } from '../configLoader';
import { Nance } from '../nance';
import { NanceTreasury } from '../treasury';
import { sleep } from '../utils';

async function main() {
  const config = await getConfig();
  const nance = new Nance(config);
  await sleep(2000);
  const payouts = await nance.dProposalHandler.getPayoutsDb('V3');
  const currentGovernanceCycle = await (await nance.dProposalHandler.getCurrentGovernanceCycle()).toString();
  await nance.dialogHandler.sendPayoutsTable(payouts, currentGovernanceCycle);
}

main();

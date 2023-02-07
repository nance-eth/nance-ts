import { getConfig } from '../configLoader';
import { Nance } from '../nance';
import { NanceTreasury } from '../treasury';
import { sleep } from '../utils';

async function main() {
  const config = await getConfig();
  const nance = new Nance(config);
  await sleep(2000);
  const payouts = await nance.dProposalHandler.getPayoutsDb('V3');
  await nance.dialogHandler.sendPayoutsTable(payouts, '41');
}

main();

import { Nance } from '../nance';
import { NanceTreasury } from '../treasury';
import { getConfig } from '../configLoader';

async function main() {
  const config = await getConfig();
  const nance = new Nance(config);
  const treasury = new NanceTreasury(nance);
  treasury.updatePayoutTableFromProposals('29');
}

main();
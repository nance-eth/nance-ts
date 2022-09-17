import { Nance } from '../nance';
import { NanceExtensions } from '../extensions';
import { NanceTreasury } from '../treasury';
import { getConfig } from '../configLoader';

async function main() {
  const config = await getConfig();
  const nance = new Nance(config);
  const treasury = new NanceTreasury(nance);

  const p = await treasury.encodeReconfigureFundingCyclesOf();
  console.log(p.data);
}

main();

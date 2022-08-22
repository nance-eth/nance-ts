import { getConfig } from '../configLoader';
import { Nance } from '../nance';
import { NanceTreasury } from '../treasury';

async function main() {
  const config = await getConfig();
  const nance = new Nance(config);
  const nanceTreasury = new NanceTreasury(config, nance)
  console.log(await nanceTreasury.buildFundingCycleData('V1'));
  console.log(await nanceTreasury.buildFundingCycleData('V2'));
}

main();
import { Nance } from '../nance';
import { DoltSysHandler } from '../dolt/doltSysHandler';
import { pools } from '../dolt/pools';
import { getSpaceInfo } from '../api/helpers/getSpace';

const doltSys = new DoltSysHandler(pools.nance_sys);

async function main() {
  const spaceInfo = await getSpaceInfo(process.env.CONFIG || '')
  const nance = new Nance(spaceInfo.config);
  console.log(spaceInfo.currentEvent)
  nance.temperatureCheckSetup(spaceInfo.currentEvent.end);
}

main();

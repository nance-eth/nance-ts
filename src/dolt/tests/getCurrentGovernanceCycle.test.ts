import { DoltSysHandler } from '../doltSysHandler';
import { pools } from '../pools';

async function main() {
  const doltSys = new DoltSysHandler(pools.nance_sys);
  const info = await doltSys.getSpaceConfig('juicebox');
  console.log(info?.cycleStageLengths.reduce((a, b) => { return a + b; }, 0));
}

main();

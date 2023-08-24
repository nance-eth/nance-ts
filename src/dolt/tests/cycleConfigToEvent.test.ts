import { pools } from '../pools';
import { DoltSysHandler } from '../doltSysHandler';
import { getCurrentEvent } from '../helpers/cycleConfigToDateEvent';

async function main() {
  const doltSys = new DoltSysHandler(pools.nance_sys);
  const info = await doltSys.getSpaceConfig('juicebox');
  console.log(info?.space);
  if (info) console.log(getCurrentEvent(info));
}

main();

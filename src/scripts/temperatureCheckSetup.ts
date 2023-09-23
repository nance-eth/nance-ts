import { Nance } from '../nance';
import { DoltSysHandler } from '../dolt/doltSysHandler';
import { pools } from '../dolt/pools';
import { getCurrentAndNextEvent } from '../dolt/helpers/cycleConfigToDateEvent';

const doltSys = new DoltSysHandler(pools.nance_sys);

async function main() {
  const spaceConfig = await doltSys.getSpaceConfig(process.env.CONFIG || ''); ;
  const [currentEvent, nextEvent] = getCurrentAndNextEvent(spaceConfig);
  const nance = new Nance(spaceConfig.config);
  console.log(currentEvent)
  nance.temperatureCheckSetup(currentEvent.end);
}

main();

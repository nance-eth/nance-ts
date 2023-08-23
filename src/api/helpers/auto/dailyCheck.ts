import { SpaceAuto } from '../../models';
import { discordLogin } from '../discord';
import { shouldIncrementDay } from './logic';
import { DoltSysHandler } from '../../../dolt/doltSysHandler';
import { pools } from '../../../dolt/pools';
// import { juiceboxTime } from '../juicebox';

const doltSys = new DoltSysHandler(pools.nance_sys);

export const handleDailyCheck = async (space: SpaceAuto) => {
  if (shouldIncrementDay(space)) {
    await doltSys.incrementCycleDay(space.name);
    // reread space config to see if cycleCurrentDay needs to roll over and if governanceCycle was updated
    const recheck = await doltSys.getSpaceConfig(space.name);
    if (recheck) {
      const { cycleCurrentDay, currentGovernanceCycle } = recheck;
      const dialogHandler = await discordLogin(space.config);
      const currentEvent = space.currentEvent.title.toLowerCase();
      // const { currentDay, currentCycle, remainingDHM, endTimestamp } = await juiceboxTime(space.config?.juicebox?.projectId);
      await dialogHandler.sendImageReminder(cycleCurrentDay.toString(), currentGovernanceCycle.toString(), currentEvent);
      await doltSys.updateCycleDayLastUpdated(space.name);
    }
  }
};

import { SpaceAuto } from '../../models';
import { discordLogin } from '../discord';
import { shouldIncrementDay } from './logic';
import { DoltSysHandler } from '../../../dolt/doltSysHandler';
import { pools } from '../../../dolt/pools';
import { dateAtTime } from '../../../utils';
// import { juiceboxTime } from '../juicebox';

const doltSys = new DoltSysHandler(pools.nance_sys);

const safeIncrement = (space: SpaceAuto) => {
  const determineCycleDay = (space.currentDay + 1 <= space.totalCycleDays) ? space.currentDay + 1 : 1;
  const determineGovernanceCycle = determineCycleDay === 1 ? space.currentCycle + 1 : space.currentCycle;
  const determineCurrentEvent = determineCycleDay === 1 ? space.nextEvent : space.currentEvent;
  return {
    cycleCurrentDay: determineCycleDay,
    currentGovernanceCycle: determineGovernanceCycle,
    currentEvent: determineCurrentEvent,
  };
};

export const handleDaily = async (space: SpaceAuto) => {
  if (shouldIncrementDay(space)) {
    const { cycleCurrentDay, currentGovernanceCycle, currentEvent } = safeIncrement(space);
    const dialogHandler = await discordLogin(space.config);
    const currentEventTitle = currentEvent.title.toLowerCase();
    // const { currentDay, currentCycle, remainingDHM, endTimestamp } = await juiceboxTime(space.config?.juicebox?.projectId);
    await dialogHandler.sendImageReminder(cycleCurrentDay.toString(), currentGovernanceCycle.toString(), currentEventTitle).then(async () => {
      await doltSys.updateCycle(
        space.name,
        cycleCurrentDay,
        currentGovernanceCycle,
        dateAtTime(new Date(), space.cycleTriggerTime), // set to trigger time for next run
      );
    });
  }
};

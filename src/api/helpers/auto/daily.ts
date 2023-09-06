import { SpaceAuto } from '../../models';
import { discordLogin } from '../discord';
import { shouldIncrementDay } from './logic';
import { DoltSysHandler } from '../../../dolt/doltSysHandler';
import { pools } from '../../../dolt/pools';
import { dateAtTime } from '../../../utils';
import { juiceboxTime } from '../juicebox';
import { events } from './constants';

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
  if (!shouldIncrementDay(space)) return false;

  let cycleCurrentDay;
  let currentGovernanceCycle;
  let currentEvent;
  let endTimestamp;
  const textReminderDays = [20, 15, 10, 5, 4, 3, 2, 1]; // TODO make a config variable, hardcoded for NANA for now

  if (space.totalCycleDays !== 0) {
    ({ cycleCurrentDay, currentGovernanceCycle, currentEvent } = safeIncrement(space));
  } else {
    ({ cycleCurrentDay, currentGovernanceCycle, endTimestamp } = await juiceboxTime(space.config?.juicebox?.projectId));
    if (!textReminderDays.includes(cycleCurrentDay)) return false;
  }
  const dialogHandler = await discordLogin(space.config);
  const currentEventTitle = currentEvent?.title.toLowerCase() || '';
  try {
    const messageSentToChannels = await dialogHandler.sendImageReminder(cycleCurrentDay, currentGovernanceCycle, currentEventTitle, !!endTimestamp, endTimestamp);
    if (messageSentToChannels) {
      await doltSys.updateCycle(
        space.name,
        cycleCurrentDay,
        currentGovernanceCycle,
        dateAtTime(new Date(), space.cycleTriggerTime), // set to trigger time for next run
      );
    }
    return messageSentToChannels;
  } catch (e) {
    return Promise.reject(e);
  }
};

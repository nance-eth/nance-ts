import { SpaceInfo } from '../../models';
import { discordLogin } from '../discord';
import { shouldIncrementDay } from './logic';
import { DoltSysHandler } from '../../../dolt/doltSysHandler';
import { pools } from '../../../dolt/pools';
import { addDaysToDate, dateAtTime } from '../../../utils';
import { EVENTS } from './constants';
import logger from '../../../logging';

const doltSys = new DoltSysHandler(pools.nance_sys);

const safeIncrement = (space: SpaceInfo) => {
  if (!space.totalCycleDays) return { updatedCycleCurrentDay: space.currentDay, updatedCurrentGovernanceCycle: space.currentCycle, updatedCurrentEvent: space.currentEvent };
  const determineCycleDay = (space.currentDay + 1 <= space.totalCycleDays) ? space.currentDay + 1 : 1;
  const determineGovernanceCycle = determineCycleDay === 1 ? space.currentCycle + 1 : space.currentCycle;
  const determineCurrentEvent = determineCycleDay === 1 ? space.nextEvent : space.currentEvent;
  // the start end dates are off by one if we have incremented the currrent day
  const correctedCurrentEvent = { title: determineCurrentEvent.title, start: addDaysToDate(determineCurrentEvent.start, -1), end: addDaysToDate(determineCurrentEvent.end, -1) };
  return {
    updatedCycleCurrentDay: determineCycleDay,
    updatedCurrentGovernanceCycle: determineGovernanceCycle,
    updatedCurrentEvent: correctedCurrentEvent,
  };
};

export const handleDaily = async (space: SpaceInfo): Promise<SpaceInfo> => {
  if (!shouldIncrementDay(space)) return space;

  const { updatedCurrentEvent, updatedCurrentGovernanceCycle, updatedCycleCurrentDay } = safeIncrement(space);

  const dialogHandler = await discordLogin(space.config);
  try {
    const eventTitle = updatedCurrentEvent.title;
    const messageSentToChannels = await dialogHandler.sendImageReminder(updatedCycleCurrentDay, updatedCurrentGovernanceCycle, eventTitle, updatedCurrentEvent.end, eventTitle === EVENTS.NULL);
    if (messageSentToChannels) {
      await doltSys.updateCycle(
        space.name,
        updatedCycleCurrentDay,
        updatedCurrentGovernanceCycle,
        dateAtTime(new Date(), space.cycleTriggerTime), // set to trigger time for next run
      );
    }
    logger.info(`nance-auto: [${space.name}] currentDay: ${updatedCycleCurrentDay}, currentCycle: ${updatedCurrentGovernanceCycle}, currentEvent ${eventTitle}, eventEnd ${updatedCurrentEvent.end.toISOString()}`);
    return { ...space, currentDay: updatedCycleCurrentDay, currentCycle: updatedCurrentGovernanceCycle, currentEvent: updatedCurrentEvent };
  } catch (e) {
    return Promise.reject(e);
  }
};

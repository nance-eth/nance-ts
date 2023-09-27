import { SpaceInfo } from '../../models';
import { discordLogin } from '../discord';
import { shouldIncrementDay } from './logic';
import { DoltSysHandler } from '../../../dolt/doltSysHandler';
import { pools } from '../../../dolt/pools';
import { dateAtTime } from '../../../utils';
import { EVENTS } from './constants';
import logger from '../../../logging';

const doltSys = new DoltSysHandler(pools.nance_sys);

const safeIncrement = (space: SpaceInfo) => {
  const determineCycleDay = (space.currentDay + 1 <= space.totalCycleDays) ? space.currentDay + 1 : 1;
  const determineGovernanceCycle = determineCycleDay === 1 ? space.currentCycle + 1 : space.currentCycle;
  const determineCurrentEvent = determineCycleDay === 1 ? space.nextEvent : space.currentEvent;
  return {
    updatedCycleCurrentDay: determineCycleDay,
    updatedCurrentGovernanceCycle: determineGovernanceCycle,
    updatedCurrentEvent: determineCurrentEvent,
  };
};

export const handleDaily = async (space: SpaceInfo): Promise<SpaceInfo> => {
  if (!shouldIncrementDay(space)) return space;

  const textReminderDays = [20, 15, 10, 5, 4, 3, 2, 1]; // TODO make a config variable, hardcoded for NANA for now

  const { updatedCurrentEvent, updatedCurrentGovernanceCycle, updatedCycleCurrentDay } = safeIncrement(space);
  if (!textReminderDays.includes(updatedCycleCurrentDay)) return space;

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
    logger.info(`nance-auto: ${space.name} ${updatedCycleCurrentDay} ${updatedCurrentGovernanceCycle} ${eventTitle} ${updatedCurrentEvent.end.toISOString()}`);
    return { ...space, currentDay: updatedCycleCurrentDay, currentCycle: updatedCurrentGovernanceCycle, currentEvent: updatedCurrentEvent };
  } catch (e) {
    return Promise.reject(e);
  }
};

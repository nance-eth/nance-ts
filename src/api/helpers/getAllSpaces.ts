import { DoltSysHandler } from '../../dolt/doltSysHandler';
import { DoltHandler } from '../../dolt/doltHandler';
import { CalendarHandler } from '../../calendar/CalendarHandler';
import { pools } from '../../dolt/pools';
import { SpaceAuto } from '../models';
import { mySQLTimeToUTC } from '../../utils';

const getAllSpaces = async (): Promise<SpaceAuto[]> => {
  try {
    const doltSys = new DoltSysHandler(pools.nance_sys);
    return await doltSys.getAllSpaceNames().then(async (data) => {
      return Promise.all(data.map(async (entry) => {
        const dolt = new DoltHandler(pools[entry.space], entry.config.propertyKeys);
        const calendar = new CalendarHandler(entry.calendar);
        const currentCycle = await dolt.getCurrentGovernanceCycle();
        const currentEvent = calendar.getCurrentEvent();
        return {
          name: entry.space,
          currentCycle,
          currentEvent,
          currentDay: entry.cycleCurrentDay,
          cycleTriggerTime: entry.cycleTriggerTime,
          cycleDayLastUpdated: mySQLTimeToUTC(entry.cycleDayLastUpdated),
          dialog: { ...entry.dialogHandlerMessageIds },
          config: entry.config,
        };
      }));
    });
  } catch (e) {
    return Promise.reject(e);
  }
};

export default getAllSpaces;

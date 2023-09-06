import { DoltSysHandler } from '../../dolt/doltSysHandler';
import { DoltHandler } from '../../dolt/doltHandler';
import { pools } from '../../dolt/pools';
import { SpaceAuto } from '../models';
import { mySQLTimeToUTC } from '../../utils';
import { getCurrentEvent } from '../../dolt/helpers/cycleConfigToDateEvent';
import { headToUrl } from '../../dolt/doltAPI';
import { juiceboxTime } from './juicebox';

const getAllSpaces = async (): Promise<SpaceAuto[]> => {
  try {
    const doltSys = new DoltSysHandler(pools.nance_sys);
    return await doltSys.getAllSpaceNames().then(async (data) => {
      return Promise.all(data.map(async (entry) => {
        const dolt = new DoltHandler(pools[entry.space], entry.config.propertyKeys);
        const currentCycle = entry.currentGovernanceCycle || (await juiceboxTime(entry.config.juicebox.projectId)).currentGovernanceCycle;
        const [currentEvent, nextEvent] = getCurrentEvent(entry);
        const totalCycleDays = (entry.cycleStageLengths) ? entry.cycleStageLengths.reduce((a, b) => { return a + b; }, 0) : 0;
        const head = await dolt.getHead();
        return {
          name: entry.space,
          currentCycle,
          currentEvent,
          nextEvent,
          totalCycleDays,
          currentDay: entry.cycleCurrentDay,
          cycleTriggerTime: entry.cycleTriggerTime,
          cycleDayLastUpdated: mySQLTimeToUTC(entry.cycleDayLastUpdated),
          dialog: { ...entry.dialogHandlerMessageIds },
          config: entry.config,
          dolthubLink: headToUrl(entry.config.dolt.owner, entry.config.dolt.repo, head),
        };
      }));
    });
  } catch (e) {
    return Promise.reject(e);
  }
};

export default getAllSpaces;

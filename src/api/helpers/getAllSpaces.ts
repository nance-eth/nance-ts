import { DoltSysHandler } from '../../dolt/doltSysHandler';
import { DoltHandler } from '../../dolt/doltHandler';
import { CalendarHandler } from '../../calendar/CalendarHandler';
import { headToUrl } from '../../dolt/doltAPI';
import { pools } from '../../dolt/pools';

const getAllSpaces = async () => {
  try {
    const doltSys = new DoltSysHandler(pools.nance_sys);
    return await doltSys.getAllSpaceNames().then(async (data) => {
      return Promise.all(data.map(async (entry) => {
        const dolt = new DoltHandler(pools[entry.space], entry.config.propertyKeys);
        const calendar = new CalendarHandler(entry.calendar);
        const currentCycle = await dolt.getCurrentGovernanceCycle();
        const currentEvent = calendar.getCurrentEvent();
        const head = await dolt.getHead();
        return {
          name: entry.space,
          currentCycle,
          currentEvent,
          snapshotSpace: entry.config.snapshot.space,
          juiceboxProjectId: entry.config.juicebox.projectId,
          dolthubLink: headToUrl(entry.config.dolt.owner, entry.config.dolt.repo, head),
        };
      }));
    });
  } catch (e) {
    return Promise.reject(e);
  }
};

export default getAllSpaces;

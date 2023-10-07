import { DoltSysHandler } from '../../dolt/doltSysHandler';
import { DoltHandler } from '../../dolt/doltHandler';
import { pools } from '../../dolt/pools';
import { SpaceInfo } from '../models';
import { mySQLTimeToUTC } from '../../utils';
import { headToUrl } from '../../dolt/doltAPI';
import { juiceboxTime } from './juicebox';
import { DateEvent } from '../../types';
import { EVENTS } from '../../constants';
import { getCurrentEvent, getCurrentGovernanceCycleDay } from '../../calendar/events';

const doltSys = new DoltSysHandler(pools.nance_sys);

export const getSpaceInfo = async (space: string): Promise<SpaceInfo> => {
  try {
    const entry = await doltSys.getSpaceConfig(space);
    const dolt = new DoltHandler(pools[space], entry.config.proposalIdPrefix);
    let juiceboxTimeOutput;
    let currentEvent: DateEvent;
    let cycleCurrentDay: number;
    let { currentGovernanceCycle } = entry;
    const currentEventFromCalendar = getCurrentEvent(entry.calendar, entry.cycleStageLengths, new Date());
    // if no current cycle information, fetch from juicebox
    if (!currentEventFromCalendar) {
      juiceboxTimeOutput = await juiceboxTime(entry.config.juicebox.projectId);
      ({ cycleCurrentDay, currentGovernanceCycle } = juiceboxTimeOutput);
      currentEvent = { title: EVENTS.NULL, start: new Date(juiceboxTimeOutput.startTimestamp), end: new Date(juiceboxTimeOutput.endTimestamp) };
    } else {
      currentEvent = currentEventFromCalendar;
      cycleCurrentDay = getCurrentGovernanceCycleDay(currentEvent, entry.cycleStageLengths, new Date());
    }
    const dolthubLink = await dolt.getHead().then((head) => {
      return headToUrl(entry.config.dolt.owner, entry.config.dolt.repo, head);
    }).catch((e) => {
      console.log('error getting dolthub link', e);
      return '';
    });
    return {
      name: space,
      currentCycle: currentGovernanceCycle,
      currentEvent,
      currentDay: cycleCurrentDay,
      cycleTriggerTime: entry.cycleTriggerTime,
      cycleDayLastUpdated: mySQLTimeToUTC(entry.cycleDayLastUpdated),
      dialog: { ...entry.dialogHandlerMessageIds },
      config: entry.config,
      spaceOwners: entry.spaceOwners,
      dolthubLink,
      snapshotSpace: entry.config.snapshot.space,
      juiceboxProjectId: entry.config.juicebox.projectId,
    };
  } catch (e) {
    return Promise.reject(e);
  }
};

export const getAllSpaceInfo = async (where?: string): Promise<SpaceInfo[]> => {
  try {
    return await doltSys.getAllSpaceNames(where).then(async (data) => {
      return Promise.all(data.map(async (entry) => {
        return getSpaceInfo(entry.space);
      }));
    });
  } catch (e) {
    return Promise.reject(e);
  }
};

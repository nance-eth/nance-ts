/* eslint-disable prefer-promise-reject-errors */
import { SpaceInfoExtended, InternalDateEvent, DateEvent, SQLSpaceConfig } from '@nance/nance-sdk';
import { sum } from "lodash";
import { DoltSysHandler } from '../../dolt/doltSysHandler';
import { pools } from '../../dolt/pools';
import { juiceboxTime } from './juicebox';
import { getCurrentEvent, getCurrentGovernanceCycleDay, getNextEvents } from '../../calendar/events';
import { EVENTS } from "../../constants";
import { getNextEventByName } from "./getNextEventByName";
import { addDaysToDate } from "../../utils";

const doltSys = new DoltSysHandler(pools.nance_sys);

export const getSpaceInfo = async (spaceConfig: SQLSpaceConfig): Promise<SpaceInfoExtended> => {
  const spaces = Object.keys(pools);
  if (!spaces.includes(spaceConfig.space)) return Promise.reject(`space ${spaceConfig.space} not found`);

  try {
    let juiceboxTimeOutput;
    let currentEvent: InternalDateEvent;
    let nextEvents: InternalDateEvent[] = [];
    let currentCycleDay: number;
    let cycleStartDate;
    let { currentGovernanceCycle } = spaceConfig;
    const { config, cycleStageLengths, cycleStartReference } = spaceConfig;
    if (!cycleStageLengths || !cycleStartReference) {
      juiceboxTimeOutput = await juiceboxTime(config.juicebox.projectId, config.juicebox.network as 'mainnet' | 'goerli');
      ({ cycleCurrentDay: currentCycleDay, currentGovernanceCycle } = juiceboxTimeOutput);
      currentEvent = {
        title: EVENTS.UNKNOWN,
        start: new Date(juiceboxTimeOutput.start),
        end: new Date(juiceboxTimeOutput.end),
      };
      cycleStartDate = currentEvent.start;
    } else {
      nextEvents = getNextEvents(cycleStartReference, cycleStageLengths, new Date());
      currentEvent = getCurrentEvent(cycleStartReference, cycleStageLengths, new Date(), nextEvents);
      currentCycleDay = getCurrentGovernanceCycleDay(currentEvent, cycleStageLengths, new Date());
      cycleStartDate = getNextEventByName(EVENTS.TEMPERATURE_CHECK, spaceConfig)?.start || new Date();
      // if this the cycle start date is in the past, then we are currently in TEMPERATURE_CHECK and need to add 14 days
      if (cycleStartDate < new Date()) {
        cycleStartDate = addDaysToDate(cycleStartDate, sum(cycleStageLengths));
      }
    }
    const stringCurrentEvent = {
      title: currentEvent.title,
      start: currentEvent.start.toISOString(),
      end: currentEvent.end.toISOString(),
    };

    const stringNextEvents = nextEvents.reduce((acc, event, index) => {
      if (index === 0) return acc;
      if (acc.map((e) => e.title).includes(event.title)) return acc;
      return [...acc, { title: event.title, start: event.start.toISOString(), end: event.end.toISOString() }];
    }, [] as DateEvent[]);

    const cycleTriggerTime = cycleStartReference?.toISOString().split('T')[1] || "00:00:00";
    return {
      name: spaceConfig.space,
      displayName: spaceConfig.displayName || spaceConfig.space,
      currentCycle: currentGovernanceCycle,
      cycleStartDate: cycleStartDate.toISOString(),
      currentEvent: stringCurrentEvent,
      nextEvents: stringNextEvents,
      currentCycleDay,
      cycleTriggerTime,
      dialog: { ...spaceConfig.dialogHandlerMessageIds },
      config: spaceConfig.config,
      spaceOwners: spaceConfig.spaceOwners,
      snapshotSpace: spaceConfig.config.snapshot.space,
      juiceboxProjectId: spaceConfig.config.juicebox.projectId,
    };
  } catch (e) {
    return Promise.reject(e);
  }
};

export const getAllSpaceInfo = async (where?: string): Promise<SpaceInfoExtended[]> => {
  try {
    const spaceConfigs = await doltSys.getAllSpaceConfig(where);
    const spaceInfos = await Promise.all(spaceConfigs.map(async (entry) => {
      return getSpaceInfo(entry);
    }));
    const filteredSpaceInfoArray = spaceInfos.filter((entry) => entry !== undefined) as SpaceInfoExtended[];
    return filteredSpaceInfoArray;
  } catch (e) {
    return Promise.reject(e);
  }
};

export const getSpaceConfig = async (space: string): Promise<SQLSpaceConfig> => {
  try {
    const entry = await doltSys.getSpaceConfig(space);
    return entry;
  } catch (e) {
    return Promise.reject(e);
  }
};

export const getAllSpaceConfig = async (where?: string): Promise<SQLSpaceConfig[]> => {
  try {
    return await doltSys.getAllSpaceConfig(where);
  } catch (e) {
    return Promise.reject(e);
  }
};

export const getSpaceByDiscordGuildId = async (discordGuildId: string): Promise<SpaceInfoExtended> => {
  try {
    const entry = await doltSys.getSpaceByDiscordGuildId(discordGuildId);
    return await getSpaceInfo(entry);
  } catch (e) {
    return Promise.reject(e);
  }
};

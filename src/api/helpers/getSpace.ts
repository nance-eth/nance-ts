/* eslint-disable prefer-promise-reject-errors */
import { DoltSysHandler } from '../../dolt/doltSysHandler';
import { pools } from '../../dolt/pools';
import { SpaceInfoExtended } from '../models';
import { juiceboxTime } from './juicebox';
import { DateEvent } from '../../types';
import { getCurrentEvent, getCurrentGovernanceCycleDay } from '../../calendar/events';
import { SpaceConfig } from '../../dolt/schema';
import { EVENTS } from "../../constants";
import { getNextEventByName } from "./getNextEventByName";
import { addDaysToDate } from "../../utils";

const doltSys = new DoltSysHandler(pools.nance_sys);

export const getSpaceInfo = async (spaceConfig: SpaceConfig): Promise<SpaceInfoExtended> => {
  const spaces = Object.keys(pools);
  if (!spaces.includes(spaceConfig.space)) return Promise.reject(`space ${spaceConfig.space} not found`);

  try {
    let juiceboxTimeOutput;
    let currentEvent: DateEvent;
    let cycleCurrentDay: number;
    let cycleStartDate: Date;
    let { currentGovernanceCycle } = spaceConfig;
    if (!spaceConfig.calendar) {
      juiceboxTimeOutput = await juiceboxTime(spaceConfig.config.juicebox.projectId, spaceConfig.config.juicebox.network);
      ({ cycleCurrentDay, currentGovernanceCycle } = juiceboxTimeOutput);
      currentEvent = {
        title: 'NULL',
        start: new Date(juiceboxTimeOutput.start),
        end: new Date(juiceboxTimeOutput.end),
      };
      cycleStartDate = currentEvent.start;
    } else {
      currentEvent = getCurrentEvent(spaceConfig.calendar, spaceConfig.cycleStageLengths, new Date());
      cycleCurrentDay = getCurrentGovernanceCycleDay(currentEvent, spaceConfig.cycleStageLengths, new Date());
      cycleStartDate = getNextEventByName(EVENTS.TEMPERATURE_CHECK, spaceConfig)?.start || new Date();
      // if this the cycle start date is in the past, then we are currently in TEMPERATURE_CHECK and need to add 14 days
      if (cycleStartDate < new Date()) {
        cycleStartDate = addDaysToDate(cycleStartDate, 14);
      }
    }
    const dolthubLink = '';
    return {
      name: spaceConfig.space,
      displayName: spaceConfig.displayName || spaceConfig.space,
      currentCycle: currentGovernanceCycle,
      cycleStartDate,
      currentEvent,
      currentDay: cycleCurrentDay,
      cycleTriggerTime: spaceConfig.cycleTriggerTime,
      dialog: { ...spaceConfig.dialogHandlerMessageIds },
      config: spaceConfig.config,
      spaceOwners: spaceConfig.spaceOwners,
      dolthubLink,
      snapshotSpace: spaceConfig.config.snapshot.space,
      juiceboxProjectId: spaceConfig.config.juicebox.projectId,
      nextProposalId: spaceConfig.proposalCount + 1,
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

export const getSpaceConfig = async (space: string): Promise<SpaceConfig> => {
  try {
    const entry = await doltSys.getSpaceConfig(space);
    return entry;
  } catch (e) {
    return Promise.reject(e);
  }
};

export const getAllSpaceConfig = async (where?: string): Promise<SpaceConfig[]> => {
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

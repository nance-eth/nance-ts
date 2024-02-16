/* eslint-disable prefer-promise-reject-errors */
import { DoltSysHandler } from '../../dolt/doltSysHandler';
import { DoltHandler } from '../../dolt/doltHandler';
import { pools } from '../../dolt/pools';
import { SpaceInfoExtended } from '../models';
import { headToUrl } from '../../dolt/doltAPI';
import { juiceboxTime } from './juicebox';
import { DateEvent } from '../../types';
import { getCurrentEvent, getCurrentGovernanceCycleDay } from '../../calendar/events';
import { SpaceConfig } from '../../dolt/schema';

const doltSys = new DoltSysHandler(pools.nance_sys);

export const getSpaceInfo = async (space: string): Promise<SpaceInfoExtended> => {
  const spaces = Object.keys(pools);
  if (!spaces.includes(space)) return Promise.reject(`space ${space} not found`);
  try {
    const entry = await doltSys.getSpaceConfig(space);
    const dolt = new DoltHandler(pools[space], entry.config.proposalIdPrefix);
    let juiceboxTimeOutput;
    let currentEvent: DateEvent;
    let cycleCurrentDay: number;
    let { currentGovernanceCycle } = entry;
    if (!entry.calendar) {
      juiceboxTimeOutput = await juiceboxTime(entry.config.juicebox.projectId, entry.config.juicebox.network);
      ({ cycleCurrentDay, currentGovernanceCycle } = juiceboxTimeOutput);
      currentEvent = {
        title: 'NULL',
        start: new Date(juiceboxTimeOutput.start),
        end: new Date(juiceboxTimeOutput.end),
      };
    } else {
      currentEvent = getCurrentEvent(entry.calendar, entry.cycleStageLengths, new Date());
      cycleCurrentDay = getCurrentGovernanceCycleDay(currentEvent, entry.cycleStageLengths, new Date());
    }
    const dolthubLink = await dolt.getHead().then((head) => {
      return headToUrl(entry.config.dolt.owner, entry.config.dolt.repo, head);
    }).catch((e) => {
      console.log('error getting dolthub link', e);
      return '';
    });
    const nextProposalId = await dolt.getNextProposalId();
    return {
      name: space,
      displayName: entry.displayName || space,
      currentCycle: currentGovernanceCycle,
      currentEvent,
      currentDay: cycleCurrentDay,
      cycleTriggerTime: entry.cycleTriggerTime,
      dialog: { ...entry.dialogHandlerMessageIds },
      config: entry.config,
      spaceOwners: entry.spaceOwners,
      dolthubLink,
      snapshotSpace: entry.config.snapshot.space,
      juiceboxProjectId: entry.config.juicebox.projectId,
      nextProposalId,
    };
  } catch (e) {
    return Promise.reject(e);
  }
};

export const getAllSpaceInfo = async (where?: string): Promise<SpaceInfoExtended[]> => {
  try {
    const spaces = await doltSys.getAllSpaceNames(where);
    const spaceInfos = await Promise.all(spaces.map((entry) => getSpaceInfo(entry.space)));
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
    return await doltSys.getAllSpaceNames(where).then(async (data) => {
      return Promise.all(data.map(async (entry) => {
        return getSpaceConfig(entry.space);
      }));
    });
  } catch (e) {
    return Promise.reject(e);
  }
};

export const getSpaceByDiscordGuildId = async (discordGuildId: string): Promise<SpaceInfoExtended> => {
  try {
    const entry = await doltSys.getSpaceByDiscordGuildId(discordGuildId);
    return await getSpaceInfo(entry.space);
  } catch (e) {
    return Promise.reject(e);
  }
};
